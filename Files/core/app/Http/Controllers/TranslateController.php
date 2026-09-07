<?php

namespace App\Http\Controllers;

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

        $from = $this->normalizeLangCode($validated['from'] ?? 'auto');
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

        $from = $this->normalizeLangCode($validated['from'] ?? 'auto');
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

        $translations = [];
        $poolSize = 15;

        foreach (array_chunk($texts, $poolSize) as $chunk) {
            $expanded = [];

            foreach ($chunk as $text) {
                foreach ($this->splitTextForTranslation($text) as $piece) {
                    $expanded[] = $piece;
                }
            }

            $pieceTranslations = $this->translateMany($expanded, $from, $to);

            foreach ($chunk as $text) {
                $pieces = $this->splitTextForTranslation($text);
                $translated = implode('', array_map(
                    fn ($piece) => $pieceTranslations[$piece] ?? $piece,
                    $pieces,
                ));

                $translations[$text] = ($translated !== '' && $translated !== $text)
                    ? $translated
                    : ($this->translateText($text, $from, $to) ?? $text);
            }
        }

        return response()->json(['translations' => $translations]);
    }

    /**
     * @param  array<int, string>  $texts
     * @return array<string, string>
     */
    private function translateMany(array $texts, string $from, string $to): array
    {
        $responses = Http::pool(function ($pool) use ($texts, $from, $to) {
            foreach ($texts as $index => $text) {
                $pool->as((string) $index)->timeout(12)->get('https://api.mymemory.translated.net/get', [
                    'q' => $text,
                    'langpair' => "{$from}|{$to}",
                ]);
            }
        });

        $translations = [];

        foreach ($texts as $index => $text) {
            $translation = $this->extractTranslation($responses[(string) $index] ?? null);
            $translations[$text] = $translation ?? $text;
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

    private function normalizeLangCode(string $code): string
    {
        $code = strtolower(trim($code));

        return match ($code) {
            'zh', 'zh-cn' => 'zh-CN',
            'auto', 'autodetect' => 'Autodetect',
            default => $code,
        };
    }

    private function translateText(string $text, string $from, string $to): ?string
    {
        if ($text === '') {
            return '';
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

        return implode('', $translatedChunks);
    }
}
