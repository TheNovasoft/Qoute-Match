<?php

namespace App\Lib;

use Illuminate\Support\Facades\Cache;

class FormTranslationCache
{
    private const PREFIX = 'form_translate:';

    private const TTL_SECONDS = 2592000; // 30 days

    public static function get(string $from, string $to, string $text): ?string
    {
        if ($text === '') {
            return '';
        }

        $cached = Cache::get(self::key($from, $to, $text));

        return is_string($cached) ? $cached : null;
    }

    /**
     * @param  array<int, string>  $texts
     * @return array<string, string>
     */
    public static function getMany(string $from, string $to, array $texts): array
    {
        $hits = [];

        foreach ($texts as $text) {
            $cached = self::get($from, $to, $text);
            if ($cached !== null) {
                $hits[$text] = $cached;
            }
        }

        return $hits;
    }

    public static function put(string $from, string $to, string $text, string $translation): void
    {
        if ($text === '' || $translation === '' || $translation === $text) {
            return;
        }

        Cache::put(self::key($from, $to, $text), $translation, self::TTL_SECONDS);
    }

    /**
     * @param  array<string, string>  $translations
     */
    public static function putMany(string $from, string $to, array $translations): void
    {
        foreach ($translations as $source => $translation) {
            if (! is_string($source) || ! is_string($translation)) {
                continue;
            }

            self::put($from, $to, $source, $translation);
        }
    }

    private static function key(string $from, string $to, string $text): string
    {
        return self::PREFIX.hash('sha256', "{$from}|{$to}|{$text}");
    }
}
