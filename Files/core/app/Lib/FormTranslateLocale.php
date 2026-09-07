<?php

namespace App\Lib;

use Illuminate\Http\Request;

class FormTranslateLocale
{
    /** @var array<string, string> ISO 3166-1 alpha-2 => language code */
    private const COUNTRY_CODE_TO_LANG = [
        'PK' => 'ur',
        'AF' => 'ur',
        'IN' => 'hi',
        'BD' => 'bn',
        'NP' => 'hi',
        'LK' => 'en',
        'SA' => 'ar',
        'AE' => 'ar',
        'QA' => 'ar',
        'KW' => 'ar',
        'OM' => 'ar',
        'BH' => 'ar',
        'IQ' => 'ar',
        'JO' => 'ar',
        'LB' => 'ar',
        'SY' => 'ar',
        'YE' => 'ar',
        'EG' => 'ar',
        'MA' => 'ar',
        'DZ' => 'ar',
        'TN' => 'ar',
        'LY' => 'ar',
        'SD' => 'ar',
        'PS' => 'ar',
        'CN' => 'zh-CN',
        'HK' => 'zh-CN',
        'TW' => 'zh-CN',
        'MO' => 'zh-CN',
        'JP' => 'ja',
        'KR' => 'ko',
        'ID' => 'id',
        'MY' => 'ms',
        'TH' => 'th',
        'VN' => 'vi',
        'PH' => 'en',
        'IR' => 'fa',
        'TR' => 'tr',
        'AZ' => 'tr',
        'FR' => 'fr',
        'DE' => 'de',
        'AT' => 'de',
        'CH' => 'de',
        'ES' => 'es',
        'MX' => 'es',
        'AR' => 'es',
        'CO' => 'es',
        'CL' => 'es',
        'PE' => 'es',
        'VE' => 'es',
        'PT' => 'pt',
        'BR' => 'pt',
        'IT' => 'it',
        'NL' => 'nl',
        'PL' => 'pl',
        'RU' => 'ru',
        'UA' => 'ru',
        'GB' => 'en',
        'US' => 'en',
        'CA' => 'en',
        'AU' => 'en',
        'NZ' => 'en',
        'IE' => 'en',
        'ZA' => 'en',
        'NG' => 'en',
        'GH' => 'en',
        'KE' => 'en',
        'SG' => 'en',
    ];

    /** @var array<string, string> */
    private const LANG_LABELS = [
        'en' => 'English',
        'ur' => 'Urdu',
        'ar' => 'Arabic',
        'hi' => 'Hindi',
        'bn' => 'Bengali',
        'zh-CN' => 'Chinese',
        'es' => 'Spanish',
        'fr' => 'French',
        'de' => 'German',
        'pt' => 'Portuguese',
        'tr' => 'Turkish',
        'ru' => 'Russian',
        'ja' => 'Japanese',
        'ko' => 'Korean',
        'id' => 'Indonesian',
        'ms' => 'Malay',
        'vi' => 'Vietnamese',
        'th' => 'Thai',
        'fa' => 'Persian',
        'it' => 'Italian',
        'nl' => 'Dutch',
        'pl' => 'Polish',
    ];

    public static function forRequest(?Request $request = null): array
    {
        $info = getIpInfo();
        $country = trim((string) ($info['country'][0] ?? ''));
        $countryCode = strtoupper(trim((string) ($info['code'][0] ?? '')));
        $source = 'ip';

        $lang = self::COUNTRY_CODE_TO_LANG[$countryCode] ?? null;

        if (! $lang && $request) {
            $lang = self::langFromAcceptLanguage($request->header('Accept-Language'));
            if ($lang) {
                $source = 'browser';
            }
        }

        if (! $lang) {
            $lang = 'ur';
            $source = 'default';
        }

        if ($lang === 'en') {
            $preferred = self::langFromAcceptLanguage($request?->header('Accept-Language'));
            if ($preferred && $preferred !== 'en') {
                $lang = $preferred;
                $source = 'browser';
            } elseif (! $country) {
                $lang = 'ur';
                $source = 'default';
            }
        }

        return [
            'country' => $country !== '' ? $country : null,
            'country_code' => strlen($countryCode) === 2 ? $countryCode : null,
            'lang' => $lang,
            'lang_label' => self::LANG_LABELS[$lang] ?? 'English',
            'source' => $source,
        ];
    }

    private static function langFromAcceptLanguage(?string $header): ?string
    {
        if (! $header) {
            return null;
        }

        foreach (explode(',', $header) as $part) {
            $tag = strtolower(trim(explode(';', $part)[0]));
            $base = explode('-', $tag)[0];

            $mapped = match ($base) {
                'ur' => 'ur',
                'ar' => 'ar',
                'hi' => 'hi',
                'bn' => 'bn',
                'zh' => 'zh-CN',
                'es' => 'es',
                'fr' => 'fr',
                'de' => 'de',
                'pt' => 'pt',
                'tr' => 'tr',
                'ru' => 'ru',
                'ja' => 'ja',
                'ko' => 'ko',
                'id' => 'id',
                'ms' => 'ms',
                'vi' => 'vi',
                'th' => 'th',
                'fa' => 'fa',
                'it' => 'it',
                'nl' => 'nl',
                'pl' => 'pl',
                'en' => 'en',
                default => null,
            };

            if ($mapped) {
                return $mapped;
            }
        }

        return null;
    }
}
