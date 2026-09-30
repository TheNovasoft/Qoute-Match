<?php

namespace App\Http\Controllers;

use App\Lib\FormTranslationCache;
use App\Lib\FormStaticTranslations;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TranslateController extends Controller
{
    private const CHUNK_LIMIT = 450;

    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'from' => 'nullable|string|max:12',
            'to' => 'nullable|string|max:12',
        ]);

        $from = $this->normalizeLangCode($validated['from'] ?? 'en');
        $to = $this->normalizeLangCode($validated['to'] ?? 'en');
        $text = trim($validated['text']);

        if ($text === '') {
            return response()->json(['translation' => '']);
        }

        $translation = $this->translateText($text, $from, $to);

        if ($translation === null) {
            return response()->json([
                'error' => 'Translation is unavailable right now.',
            ], 503);
        }

        FormTranslationCache::put($from, $to, $text, $translation);

        return response()->json(['translation' => $translation]);
    }

    public function translateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'texts' => 'required|array|max:50',
            'texts.*' => 'string|max:5000',
            'from' => 'nullable|string|max:12',
            'to' => 'nullable|string|max:12',
        ]);

        $from = $this->normalizeLangCode($validated['from'] ?? 'en');
        $to = $this->normalizeLangCode($validated['to'] ?? 'en');
        $texts = collect($validated['texts'])
            ->map(fn ($text) => trim((string) $text))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($texts === [] || $from === $to) {
            return response()->json([
                'translations' => collect($texts)->mapWithKeys(fn ($text) => [$text => $text])->all(),
            ]);
        }

        $translations = FormTranslationCache::getMany($from, $to, $texts);
        $pending = array_values(array_filter($texts, fn ($text) => ! array_key_exists($text, $translations)));

        if ($pending !== []) {
            $poolSize = 15;

            foreach (array_chunk($pending, $poolSize) as $chunk) {
                $expanded = [];

                foreach ($chunk as $text) {
                    foreach ($this->splitTextForTranslation($text) as $piece) {
                        $expanded[] = $piece;
                    }
                }

                $expandedPending = array_values(array_filter(
                    $expanded,
                    fn ($piece) => FormTranslationCache::get($from, $to, $piece) === null,
                ));
                $pieceTranslations = $expandedPending !== []
                    ? $this->translateMany($expandedPending, $from, $to)
                    : [];

                foreach ($expanded as $piece) {
                    if (! array_key_exists($piece, $pieceTranslations)) {
                        $cachedPiece = FormTranslationCache::get($from, $to, $piece);
                        if ($cachedPiece !== null) {
                            $pieceTranslations[$piece] = $cachedPiece;
                        }
                    }
                }

                $fresh = [];

                foreach ($chunk as $text) {
                    $pieces = $this->splitTextForTranslation($text);
                    $translated = implode('', array_map(
                        fn ($piece) => $pieceTranslations[$piece] ?? $piece,
                        $pieces,
                    ));

                    if ($translated !== '' && $translated !== $text) {
                        $fresh[$text] = $translated;
                        continue;
                    }

                    $fallback = $this->resolveTranslation($text, $from, $to);
                    $fresh[$text] = $fallback ?? $text;
                }

                FormTranslationCache::putMany($from, $to, $fresh);
                $translations = array_merge($translations, $fresh);
            }
        }

        $meta = $this->buildBatchMeta($texts, $translations, $from, $to);

        return response()->json([
            'translations' => $translations,
            'meta' => $meta,
        ]);
    }

    /**
     * @param  array<int, string>  $texts
     * @return array<string, string>
     */
    private function translateMany(array $texts, string $from, string $to): array
    {
        if ($texts === []) {
            return [];
        }

        $translations = FormTranslationCache::getMany($from, $to, $texts);
        $pending = array_values(array_filter($texts, fn ($text) => ! array_key_exists($text, $translations)));

        if ($pending === []) {
            return $translations;
        }

        // Curated dictionary first — instant, no API quota.
        $apiPending = [];
        foreach ($pending as $text) {
            $static = FormStaticTranslations::get($to, $text);
            if ($static !== null && $static !== $text) {
                $translations[$text] = $static;
                FormTranslationCache::put($from, $to, $text, $static);
                continue;
            }
            $apiPending[] = $text;
        }

        if ($apiPending === []) {
            return $translations;
        }

        $responses = Http::pool(function ($pool) use ($apiPending, $from, $to) {
            foreach ($apiPending as $index => $text) {
                $pool->as((string) $index)->timeout(12)->get('https://api.mymemory.translated.net/get', $this->myMemoryQuery($text, $from, $to));
            }
        });

        foreach ($apiPending as $index => $text) {
            $translation = $this->extractTranslation($responses[(string) $index] ?? null);

            if ($translation === null || $translation === $text) {
                $translation = $this->resolveTranslation($text, $from, $to) ?? $text;
            }

            $translations[$text] = $translation;
            FormTranslationCache::put($from, $to, $text, $translation);
        }

        return $translations;
    }

    /**
     * @return array<int, string>
     */
    private function splitTextForTranslation(string $text): array
    {
        if (mb_strlen($text) <= self::CHUNK_LIMIT) {
            return [$text];
        }

        $chunks = [];
        $remaining = $text;

        while ($remaining !== '') {
            if (mb_strlen($remaining) <= self::CHUNK_LIMIT) {
                $chunks[] = $remaining;
                break;
            }

            $piece = mb_substr($remaining, 0, self::CHUNK_LIMIT);
            $breakAt = $this->findChunkBreak($piece);

            if ($breakAt <= 0) {
                $breakAt = self::CHUNK_LIMIT;
            }

            $chunks[] = mb_substr($remaining, 0, $breakAt);
            $remaining = ltrim(mb_substr($remaining, $breakAt));
        }

        return array_values(array_filter($chunks, fn ($chunk) => $chunk !== ''));
    }

    private function findChunkBreak(string $piece): int
    {
        $candidates = [
            mb_strrpos($piece, "\n\n"),
            mb_strrpos($piece, "\n"),
            mb_strrpos($piece, '. '),
            mb_strrpos($piece, '? '),
            mb_strrpos($piece, '! '),
            mb_strrpos($piece, '; '),
            mb_strrpos($piece, ', '),
            mb_strrpos($piece, ' '),
        ];

        foreach ($candidates as $position) {
            if ($position === false) {
                continue;
            }

            if ($position >= (int) (self::CHUNK_LIMIT * 0.4)) {
                return $position + 1;
            }
        }

        return self::CHUNK_LIMIT;
    }

    private function extractTranslation(?Response $response): ?string
    {
        if (! $response || ! $response->successful()) {
            return null;
        }

        $text = data_get($response->json(), 'responseData.translatedText');
        $status = data_get($response->json(), 'responseStatus');

        if (! is_string($text) || trim($text) === '') {
            return null;
        }

        if ((int) $status !== 200) {
            return null;
        }

        if ($this->looksLikeTranslationError($text)) {
            return null;
        }

        return $text;
    }

    private function looksLikeTranslationError(string $text): bool
    {
        $upper = strtoupper($text);

        return str_contains($upper, 'QUERY LENGTH LIMIT')
            || str_contains($upper, 'MYMEMORY WARNING')
            || str_contains($upper, 'INVALID LANGUAGE')
            || str_contains($upper, 'PLEASE USE POST INSTEAD');
    }

    private function resolveTranslation(string $text, string $from, string $to): ?string
    {
        if ($text === '') {
            return '';
        }

        $static = FormStaticTranslations::get($to, $text);
        if ($static !== null && $static !== $text) {
            return $static;
        }

        return $this->fetchFromLibreTranslate($text, $from, $to);
    }

    /**
     * @return array<string, mixed>
     */
    private function myMemoryQuery(string $text, string $from, string $to): array
    {
        $query = [
            'q' => $text,
            'langpair' => $this->sourceLangForApi($from).'|'.$to,
        ];

        $email = config('services.mymemory.email');
        if (is_string($email) && $email !== '') {
            $query['de'] = $email;
        }

        return $query;
    }

    private function fetchFromLibreTranslate(string $text, string $from, string $to): ?string
    {
        $url = config('services.libretranslate.url');
        if (! is_string($url) || $url === '') {
            return null;
        }

        $source = $this->sourceLangForApi($from);
        $target = strtolower($to) === 'zh-cn' ? 'zh' : $to;

        $payload = [
            'q' => $text,
            'source' => $source,
            'target' => $target,
            'format' => 'text',
        ];

        $apiKey = config('services.libretranslate.key');
        if (is_string($apiKey) && $apiKey !== '') {
            $payload['api_key'] = $apiKey;
        }

        $response = Http::timeout(15)->post(rtrim($url, '/').'/translate', $payload);

        if (! $response->successful()) {
            return null;
        }

        $translation = data_get($response->json(), 'translatedText');

        return is_string($translation) && trim($translation) !== '' && $translation !== $text
            ? $translation
            : null;
    }

    private function sourceLangForApi(string $from): string
    {
        $code = strtolower(trim($from));

        if (in_array($code, ['auto', 'autodetect'], true)) {
            return 'en';
        }

        return $code === 'zh-cn' ? 'zh-CN' : $from;
    }

    /**
     * @param  array<int, string>  $texts
     * @param  array<string, string>  $translations
     * @return array<string, mixed>
     */
    private function buildBatchMeta(array $texts, array $translations, string $from, string $to): array
    {
        $changed = 0;
        foreach ($texts as $text) {
            $translation = $translations[$text] ?? $text;
            if ($translation !== $text) {
                $changed++;
            }
        }

        return [
            'changed' => $changed,
            'total' => count($texts),
            'used_static_fallback' => $changed > 0 && FormStaticTranslations::getMany($to, $texts) !== [],
        ];
    }

    private function normalizeLangCode(string $code): string
    {
        $code = strtolower(trim($code));

        return match ($code) {
            'zh', 'zh-cn' => 'zh-CN',
            'auto', 'autodetect' => 'en',
            default => $code,
        };
    }

    private function translateText(string $text, string $from, string $to): ?string
    {
        if ($text === '') {
            return '';
        }

        $cached = FormTranslationCache::get($from, $to, $text);
        if ($cached !== null) {
            return $cached;
        }

        $chunks = $this->splitTextForTranslation($text);
        $translatedChunks = [];

        foreach ($chunks as $chunk) {
            $result = $this->translateMany([$chunk], $from, $to)[$chunk] ?? null;

            if (! is_string($result) || $this->looksLikeTranslationError($result)) {
                return null;
            }

            $translatedChunks[] = $result;
        }

        $translation = implode('', $translatedChunks);
        FormTranslationCache::put($from, $to, $text, $translation);

        return $translation;
    }
}
