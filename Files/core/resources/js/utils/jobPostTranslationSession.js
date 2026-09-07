const SESSION_KEY = 'job_post_form_translate_active_v1';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function saveTranslationSession(targetLang, translations) {
    if (typeof window === 'undefined' || !window.sessionStorage) {
        return;
    }

    try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            targetLang,
            translations,
            expires: Date.now() + SESSION_TTL_MS,
        }));
    } catch {
        // Ignore quota errors.
    }
}

export function loadTranslationSession() {
    if (typeof window === 'undefined' || !window.sessionStorage) {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed?.translations || Date.now() > parsed.expires) {
            window.sessionStorage.removeItem(SESSION_KEY);
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

export function clearTranslationSession() {
    if (typeof window === 'undefined' || !window.sessionStorage) {
        return;
    }

    window.sessionStorage.removeItem(SESSION_KEY);
}
