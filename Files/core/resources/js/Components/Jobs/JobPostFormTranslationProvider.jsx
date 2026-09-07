import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { detectLanguageFromBrowser } from '@/utils/formTranslateLanguages';
import { translateBatch } from '@/utils/translateClient';

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

export function JobPostFormTranslationProvider({ locale, children }) {
    const targetLang = resolveTargetLang(locale);
    const langLabel = locale?.lang && locale.lang !== 'en'
        ? locale.lang_label
        : (targetLang === 'ur' ? 'Urdu' : locale?.lang_label || 'Urdu');

    const [active, setActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [translations, setTranslations] = useState({});
    const requestIdRef = useRef(0);

    const tx = useCallback((text) => {
        const key = String(text ?? '').trim();
        if (!active || !key) {
            return text;
        }

        return translations[key] ?? text;
    }, [active, translations]);

    const translateForm = useCallback(async (strings) => {
        if (active) {
            setActive(false);
            setError('');
            return;
        }

        const unique = [...new Set((strings || []).map((item) => String(item || '').trim()).filter(Boolean))];
        if (!unique.length) {
            return;
        }

        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError('');

        const priorityCount = Math.min(unique.length, 40);
        const priority = unique.slice(0, priorityCount);
        const remainder = unique.slice(priorityCount);

        try {
            const priorityMap = await translateBatch(priority, targetLang);

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (!countChangedTranslations(priorityMap)) {
                throw new Error('Translation returned no changes');
            }

            setTranslations(priorityMap);
            setActive(true);
            setLoading(false);

            if (remainder.length) {
                try {
                    const restMap = await translateBatch(remainder, targetLang);

                    if (requestId !== requestIdRef.current) {
                        return;
                    }

                    setTranslations((current) => ({ ...current, ...restMap }));
                } catch {
                    // Keep partial translations visible when background batch fails.
                }
            }
        } catch {
            if (requestId !== requestIdRef.current) {
                return;
            }

            setActive(false);
            setError('Could not translate. Try again.');
            setLoading(false);
        }
    }, [active, targetLang]);

    const value = useMemo(() => ({
        locale,
        targetLang,
        langLabel,
        active,
        loading,
        error,
        tx,
        translateForm,
    }), [locale, targetLang, langLabel, active, loading, error, tx, translateForm]);

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
    };
}
