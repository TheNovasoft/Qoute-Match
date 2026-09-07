/** Languages for the post-job form translator only. */
export const FORM_TRANSLATE_LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ur', label: 'Urdu', native: 'اردو' },
    { code: 'ar', label: 'Arabic', native: 'العربية' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'zh-CN', label: 'Chinese', native: '中文' },
    { code: 'es', label: 'Spanish', native: 'Español' },
    { code: 'fr', label: 'French', native: 'Français' },
    { code: 'de', label: 'German', native: 'Deutsch' },
    { code: 'pt', label: 'Portuguese', native: 'Português' },
    { code: 'tr', label: 'Turkish', native: 'Türkçe' },
    { code: 'ru', label: 'Russian', native: 'Русский' },
    { code: 'ja', label: 'Japanese', native: '日本語' },
    { code: 'ko', label: 'Korean', native: '한국어' },
    { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
    { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'th', label: 'Thai', native: 'ไทย' },
    { code: 'fa', label: 'Persian', native: 'فارسی' },
    { code: 'it', label: 'Italian', native: 'Italiano' },
    { code: 'nl', label: 'Dutch', native: 'Nederlands' },
    { code: 'pl', label: 'Polish', native: 'Polski' },
];

export const DEFAULT_FORM_TRANSLATE_LANG = 'en';

const SUPPORTED_CODES = new Set(FORM_TRANSLATE_LANGUAGES.map((lang) => lang.code));

/** Primary language per country name (matches country.json values). */
const COUNTRY_LANGUAGE_MAP = {
    Pakistan: 'ur',
    India: 'hi',
    Bangladesh: 'bn',
    Afghanistan: 'ur',
    Nepal: 'hi',
    'Sri Lanka': 'en',
    Maldives: 'en',
    Bhutan: 'en',

    'Saudi Arabia': 'ar',
    'United Arab Emirates': 'ar',
    Qatar: 'ar',
    Kuwait: 'ar',
    Oman: 'ar',
    Bahrain: 'ar',
    Iraq: 'ar',
    Jordan: 'ar',
    Lebanon: 'ar',
    Syria: 'ar',
    Yemen: 'ar',
    Egypt: 'ar',
    Morocco: 'ar',
    Algeria: 'ar',
    Tunisia: 'ar',
    Libya: 'ar',
    Sudan: 'ar',
    Palestine: 'ar',

    China: 'zh-CN',
    'Hong Kong': 'zh-CN',
    Taiwan: 'zh-CN',
    Macao: 'zh-CN',

    Japan: 'ja',
    'Republic of Korea': 'ko',
    'Republic of South Korea': 'ko',
    'Korea, South': 'ko',

    Indonesia: 'id',
    Malaysia: 'ms',
    Singapore: 'en',
    Thailand: 'th',
    Vietnam: 'vi',
    Philippines: 'en',
    Cambodia: 'en',
    Laos: 'en',
    Myanmar: 'en',
    Brunei: 'ms',

    Iran: 'fa',
    Turkey: 'tr',
    Azerbaijan: 'tr',

    'United Kingdom': 'en',
    'United States': 'en',
    Canada: 'en',
    Australia: 'en',
    'New Zealand': 'en',
    Ireland: 'en',
    'South Africa': 'en',
    Nigeria: 'en',
    Ghana: 'en',
    Kenya: 'en',
    Uganda: 'en',
    Tanzania: 'en',
    Jamaica: 'en',
    'Trinidad and Tobago': 'en',

    France: 'fr',
    Belgium: 'fr',
    Switzerland: 'de',
    Luxembourg: 'fr',
    Monaco: 'fr',

    Germany: 'de',
    Austria: 'de',

    Spain: 'es',
    Mexico: 'es',
    Argentina: 'es',
    Colombia: 'es',
    Chile: 'es',
    Peru: 'es',
    Venezuela: 'es',
    Ecuador: 'es',
    Guatemala: 'es',
    Cuba: 'es',
    'Dominican Republic': 'es',
    Honduras: 'es',
    Bolivia: 'es',
    Paraguay: 'es',
    Uruguay: 'es',
    'Costa Rica': 'es',
    Panama: 'es',

    Portugal: 'pt',
    Brazil: 'pt',
    Angola: 'pt',
    Mozambique: 'pt',

    Italy: 'it',
    Netherlands: 'nl',
    Poland: 'pl',
    Russia: 'ru',
    Ukraine: 'ru',
    Belarus: 'ru',
    Kazakhstan: 'ru',
};

const BROWSER_LANG_MAP = {
    en: 'en',
    ur: 'ur',
    ar: 'ar',
    hi: 'hi',
    bn: 'bn',
    zh: 'zh-CN',
    es: 'es',
    fr: 'fr',
    de: 'de',
    pt: 'pt',
    tr: 'tr',
    ru: 'ru',
    ja: 'ja',
    ko: 'ko',
    id: 'id',
    ms: 'ms',
    vi: 'vi',
    th: 'th',
    fa: 'fa',
    it: 'it',
    nl: 'nl',
    pl: 'pl',
};

export function getLanguageMeta(code) {
    return FORM_TRANSLATE_LANGUAGES.find((lang) => lang.code === code)
        || FORM_TRANSLATE_LANGUAGES.find((lang) => lang.code === DEFAULT_FORM_TRANSLATE_LANG);
}

export function languageForCountry(countryName) {
    const country = String(countryName || '').trim();
    if (!country) {
        return null;
    }

    const mapped = COUNTRY_LANGUAGE_MAP[country];
    if (mapped && SUPPORTED_CODES.has(mapped)) {
        return mapped;
    }

    return null;
}

export function detectLanguageFromBrowser() {
    const tags = [...(navigator.languages || []), navigator.language].filter(Boolean);

    for (const tag of tags) {
        const lower = String(tag).toLowerCase();
        const base = lower.split('-')[0];
        const mapped = BROWSER_LANG_MAP[base] || BROWSER_LANG_MAP[lower];

        if (mapped && SUPPORTED_CODES.has(mapped)) {
            return mapped;
        }
    }

    return DEFAULT_FORM_TRANSLATE_LANG;
}

export function extractCountriesFromFormData(data, categoryForms, categoryId) {
    const fields = categoryForms?.[categoryId]
        || categoryForms?.[String(categoryId)]
        || [];
    const countries = [];
    const seen = new Set();

    const pushCountry = (value) => {
        const country = String(value || '').trim();
        if (!country || seen.has(country)) {
            return;
        }
        seen.add(country);
        countries.push(country);
    };

    fields
        .filter((field) => field.type === 'country')
        .sort((a, b) => {
            const rank = (field) => {
                if (field.locationGroup === 'origin') return 0;
                if (!field.locationGroup) return 1;
                if (field.locationGroup === 'destination') return 2;
                return 3;
            };
            return rank(a) - rank(b);
        })
        .forEach((field) => pushCountry(data?.[field.label]));

    Object.entries(data || {}).forEach(([key, value]) => {
        if (/country/i.test(key) && typeof value === 'string') {
            pushCountry(value);
        }
    });

    return countries;
}

export function resolveFormTranslateLanguage({
    data,
    categoryForms,
    categoryId,
    browserLang = detectLanguageFromBrowser(),
}) {
    const countries = extractCountriesFromFormData(data, categoryForms, categoryId);

    for (const country of countries) {
        const lang = languageForCountry(country);
        if (lang) {
            return {
                lang,
                country,
                source: 'country',
            };
        }
    }

    if (browserLang && SUPPORTED_CODES.has(browserLang)) {
        return {
            lang: browserLang,
            country: null,
            source: 'browser',
        };
    }

    return {
        lang: DEFAULT_FORM_TRANSLATE_LANG,
        country: null,
        source: 'default',
    };
}
