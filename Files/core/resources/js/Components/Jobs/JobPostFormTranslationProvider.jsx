import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { detectLanguageFromBrowser } from '@/utils/formTranslateLanguages';
import { translateBatch } from '@/utils/translateClient';
import {
    clearTranslationSession,
    loadTranslationSession,
    saveTranslationSession,
} from '@/utils/jobPostTranslationSession';

const TRANSLATE_ERROR = 'Could not translate. Try again.';
const TRANSLATE_BUSY = 'Translation service is busy. Form labels are shown in Urdu where available.';
const BATCH_SIZE = 40;

const JobPostFormTranslationContext = createContext(null);

function resolveTargetLang(locale) {
    const detected = locale?.lang;
    if (detected && detected !== 'en') {
        return detected;
    }

    const browserLang = detectLanguageFromBrowser();
    if (browserLang && browserLang !== 'en') {
        return browserLang;
    }

    return 'ur';
}

function countChangedTranslations(map) {
    return Object.entries(map || {}).filter(([source, translated]) => (
        translated && translated !== source
    )).length;
}

async function translateAllStrings(strings, targetLang) {
    const unique = [...new Set((strings || []).map((item) => String(item || '').trim()).filter(Boolean))];
    if (!unique.length) {
        return {};
    }

    let merged = {};

    for (let index = 0; index < unique.length; index += BATCH_SIZE) {
        const chunk = unique.slice(index, index + BATCH_SIZE);
        const chunkMap = await translateBatch(chunk, targetLang);
        merged = { ...merged, ...chunkMap };
    }

    return merged;
}

function readInitialSession() {
    return loadTranslationSession();
}

export function JobPostFormTranslationProvider({ locale, children }) {
    const initialSession = useMemo(() => readInitialSession(), []);
    const targetLang = initialSession?.targetLang || resolveTargetLang(locale);
    const langLabel = locale?.lang && locale.lang !== 'en'
        ? locale.lang_label
        : (targetLang === 'ur' ? 'Urdu' : locale?.lang_label || 'Urdu');

    const [active, setActive] = useState(() => Boolean(initialSession?.translations && countChangedTranslations(initialSession.translations)));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [translations, setTranslations] = useState(() => initialSession?.translations || {});
    const requestIdRef = useRef(0);

    const tx = useCallback((text) => {
        const key = String(text ?? '').trim();
        if (!active || !key) {
            return text;
        }

        return translations[key] ?? text;
    }, [active, translations]);

    const applyTranslations = useCallback((map, lang = targetLang) => {
        setTranslations(map);
        setActive(countChangedTranslations(map) > 0);
        if (countChangedTranslations(map) > 0) {
            saveTranslationSession(lang, map);
        } else {
            clearTranslationSession();
        }
    }, [targetLang]);

    const ensureTranslated = useCallback(async (strings) => {
        const unique = [...new Set((strings || []).map((item) => String(item || '').trim()).filter(Boolean))];
        if (!unique.length) {
            return;
        }

        try {
            const map = await translateAllStrings(unique, targetLang);
            if (!countChangedTranslations(map)) {
                return;
            }

            setTranslations((current) => {
                const next = { ...current, ...map };
                saveTranslationSession(targetLang, next);
                return next;
            });
            setActive(true);
        } catch {
            // Keep existing translations when supplemental batch fails.
        }
    }, [targetLang]);

    const translateForm = useCallback(async (strings) => {
        if (active) {
            setActive(false);
            setError('');
            clearTranslationSession();
            return;
        }

        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError('');

        try {
            const allMap = await translateAllStrings(strings, targetLang);

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (!countChangedTranslations(allMap)) {
                throw new Error('Translation returned no changes');
            }

            applyTranslations(allMap, targetLang);

            const uniqueCount = new Set((strings || []).map((item) => String(item || '').trim()).filter(Boolean)).size;
            const changedCount = countChangedTranslations(allMap);
            if (uniqueCount > 0 && changedCount / uniqueCount < 0.75) {
                setError(TRANSLATE_BUSY);
            }
        } catch {
            if (requestId !== requestIdRef.current) {
                return;
            }

            setActive(false);
            setError(TRANSLATE_ERROR);
            clearTranslationSession();
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [active, targetLang, applyTranslations]);

    const value = useMemo(() => ({
        locale,
        targetLang,
        langLabel,
        active,
        loading,
        error,
        tx,
        translateForm,
        ensureTranslated,
    }), [locale, targetLang, langLabel, active, loading, error, tx, translateForm, ensureTranslated]);

    return (
        <JobPostFormTranslationContext.Provider value={value}>
            {children}
        </JobPostFormTranslationContext.Provider>
    );
}

export function useJobPostFormTranslation() {
    const context = useContext(JobPostFormTranslationContext);

    return context || {
        locale: null,
        targetLang: 'ur',
        langLabel: 'Urdu',
        active: false,
        loading: false,
        error: '',
        tx: (text) => text,
        translateForm: async () => {},
        ensureTranslated: async () => {},
    };
}

export function JobPostFormAutoTranslate({ strings = [] }) {
    const { ensureTranslated } = useJobPostFormTranslation();
    const { locale } = usePage().props;
    const siteLang = locale?.current || 'en';

    useEffect(() => {
        if (siteLang === 'en' || !strings.length) {
            return;
        }

        ensureTranslated(strings);
    }, [siteLang, strings, ensureTranslated]);

    return null;
}
