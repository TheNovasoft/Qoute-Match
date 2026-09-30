<?php

namespace App\Lib;

/**
 * Localize user/auto job title & description for public Urdu locale.
 * Templates cover known auto-generators; dictionary fills category/service names.
 */
class JobTextLocalizer
{
    public static function text(?string $text): string
    {
        $text = (string) $text;
        if ($text === '' || app()->getLocale() !== 'ur') {
            return $text;
        }

        $cached = FormTranslationCache::get('en', 'ur', $text);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $localized = self::rewriteKnownTemplates($text);
        $localized = self::applyDictionary($localized);

        if ($localized !== $text) {
            FormTranslationCache::put('en', 'ur', $text, $localized);
        }

        return $localized;
    }

    public static function plainExcerpt(?string $text, int $limit = 230): string
    {
        return strLimit(self::text(strip_tags((string) $text)), $limit);
    }

    private static function rewriteKnownTemplates(string $text): string
    {
        // Older / alternate auto-copy seen in listings.
        $text = preg_replace_callback(
            '/I\'m posting a (.+?) job and need a dependable specialist to help with (.+?)\.\s*'
            . 'This falls under (.+?)\.\s*'
            . 'The work will take place at a house located in (.+?)(?:\.|$)/iu',
            static function (array $m): string {
                $service = self::applyDictionary(trim($m[1]));
                $helpWith = self::applyDictionary(trim($m[2]));
                $path = self::applyDictionary(trim($m[3]));
                $place = self::applyDictionary(trim($m[4]));

                return "میں {$service} کا کام پوسٹ کر رہا ہوں اور ایک قابل اعتماد ماہر کی ضرورت ہے جو {$helpWith} میں مدد کرے۔"
                    . " یہ {$path} کے تحت آتا ہے۔ کام ایک گھر پر ہوگا جو {$place} میں واقع ہے۔";
            },
            $text
        ) ?? $text;

        $text = preg_replace_callback(
            '/I\'m posting a (.+?) job and need a dependable specialist to help with (.+?)\.\s*'
            . 'This falls under (.+?)\.\s*'
            . 'The work will take place at a house located in\s*$/iu',
            static function (array $m): string {
                $service = self::applyDictionary(trim($m[1]));
                $helpWith = self::applyDictionary(trim($m[2]));
                $path = self::applyDictionary(trim($m[3]));

                return "میں {$service} کا کام پوسٹ کر رہا ہوں اور ایک قابل اعتماد ماہر کی ضرورت ہے جو {$helpWith} میں مدد کرے۔"
                    . " یہ {$path} کے تحت آتا ہے۔ کام ایک گھر پر ہوگا جو";
            },
            $text
        ) ?? $text;

        $text = preg_replace_callback(
            '/I\'m posting a (.+?) job and need a dependable specialist to help with (.+?)\.\s*'
            . 'This falls under (.+?)\./iu',
            static function (array $m): string {
                $service = self::applyDictionary(trim($m[1]));
                $helpWith = self::applyDictionary(trim($m[2]));
                $path = self::applyDictionary(trim($m[3]));

                return "میں {$service} کا کام پوسٹ کر رہا ہوں اور ایک قابل اعتماد ماہر کی ضرورت ہے جو {$helpWith} میں مدد کرے۔"
                    . " یہ {$path} کے تحت آتا ہے۔";
            },
            $text
        ) ?? $text;

        // Current generateDescription opener.
        $text = preg_replace_callback(
            '/I\'m looking to hire a qualified professional for (.+?) '
            . '\(category: (.+?)\)\. '
            . 'Please review the details below and send a competitive quote\./iu',
            static function (array $m): string {
                $service = self::applyDictionary(trim($m[1]));
                $path = self::applyDictionary(trim($m[2]));

                return "میں {$service} کے لیے ایک اہل پیشہ ور کو ہائر کرنا چاہتا ہوں"
                    . " (زمرہ: {$path})۔ براہ کرم نیچے دی گئی تفصیلات دیکھیں اور مسابقتی کوٹ بھیجیں۔";
            },
            $text
        ) ?? $text;

        $replacements = [
            'Please review the details below and send a competitive quote.' => 'براہ کرم نیچے دی گئی تفصیلات دیکھیں اور مسابقتی کوٹ بھیجیں۔',
            'When you respond, please include:' => 'جواب دیتے وقت براہ کرم شامل کریں:',
            'Your estimated price and what is included' => 'آپ کی تخمینی قیمت اور اس میں کیا شامل ہے',
            'How soon you can start and expected completion time' => 'آپ کتنی جلدی شروع کر سکتے ہیں اور متوقع تکمیل کا وقت',
            'Relevant experience with similar jobs' => 'ملتے جلتے کاموں کا متعلقہ تجربہ',
            'Any questions about access, materials, cargo details, or site conditions' => 'رسائی، مواد، کارگو تفصیلات، یا سائٹ کے حالات کے بارے میں کوئی سوالات',
            'Thank you — I look forward to reviewing your quote.' => 'شکریہ — میں آپ کا کوٹ دیکھنے کا منتظر ہوں۔',
            'The job location postcode is' => 'نوکری کے مقام کا پوسٹ کوڈ ہے',
            'Additional location details:' => 'اضافی مقام کی تفصیلات:',
            'Preferred platform/technology:' => 'پسندیدہ پلیٹ فارم/ٹیکنالوجی:',
            'Container requirement:' => 'کنٹینر کی ضرورت:',
            'Please factor in loading, documentation, and any applicable freight charges.' => 'براہ کرم لوڈنگ، دستاویزات اور قابل اطلاق فریٹ چارجز شامل کریں۔',
            'The shipment route is from' => 'شپمنٹ کا راستہ ہے',
            'The job site is in postcode' => 'نوکری کی سائٹ کا پوسٹ کوڈ ہے',
            'The property type is a' => 'پراپرٹی کی قسم ہے',
            'My preferred start/completion window is' => 'میری پسندیدہ شروع/تکمیل ونڈو ہے',
            'Please note regarding access:' => 'رسائی کے بارے میں نوٹ کریں:',
            'Materials preference:' => 'مواد کی ترجیح:',
            'The work will take place at a house located in' => 'کام ایک گھر پر ہوگا جو واقع ہے',
            'This falls under' => 'یہ اس کے تحت آتا ہے',
            'Specialist Needed' => 'ماہر درکار',
            'I need help with' => 'مجھے مدد چاہیے',
            'I need a freight quote for' => 'مجھے فریٹ کوٹ چاہیے برائے',
            'Please describe what you need and send your quote.' => 'براہ کرم اپنی ضرورت بیان کریں اور اپنا کوٹ بھیجیں۔',
            'Please send your best rate and transit time.' => 'براہ کرم اپنی بہترین شرح اور ٹرانزٹ وقت بھیجیں۔',
            'as soon as possible' => 'جتنی جلدی ممکن ہو',
        ];

        foreach ($replacements as $english => $urdu) {
            if (str_contains($text, $english)) {
                $text = str_replace($english, $urdu, $text);
            }
        }

        return $text;
    }

    private static function applyDictionary(string $text): string
    {
        if ($text === '') {
            return $text;
        }

        $map = SiteUrduDictionary::all();
        uksort($map, fn ($a, $b) => mb_strlen((string) $b) <=> mb_strlen((string) $a));

        foreach ($map as $english => $urdu) {
            if (! is_string($english) || ! is_string($urdu) || $english === '' || $urdu === '') {
                continue;
            }
            // Skip tiny UI words that break mid-sentence English.
            if (mb_strlen($english) < 4) {
                continue;
            }
            if (stripos($text, $english) !== false) {
                $text = str_ireplace($english, $urdu, $text);
            }
        }

        return $text;
    }
}
