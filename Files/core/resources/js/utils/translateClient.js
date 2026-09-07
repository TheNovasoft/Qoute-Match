const CACHE_PREFIX = 'form_translate_v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

function getCsrfToken() {
    const fromMeta = document.querySelector('meta[name="csrf-token"]')?.content;
    if (fromMeta) {
        return fromMeta;
    }

    const inertiaRoot = document.getElementById('app');
    if (inertiaRoot?.dataset?.page) {
        try {
            const page = JSON.parse(inertiaRoot.dataset.page);
            return page?.props?.csrfToken || '';
        } catch {
            return '';
        }
    }

    return '';
}

function cacheStorageKey(from, to, text) {
    return `${CACHE_PREFIX}:${from}:${to}:${text}`;
}

function readCachedTranslation(from, to, text) {
    if (typeof window === 'undefined' || !window.sessionStorage) {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(cacheStorageKey(from, to, text));
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed?.value || Date.now() > parsed.expires || parsed.value === text) {
            window.sessionStorage.removeItem(cacheStorageKey(from, to, text));
            return null;
        }

        return parsed.value;
    } catch {
        return null;
    }
}

function writeCachedTranslation(from, to, text, translation) {
    if (typeof window === 'undefined' || !window.sessionStorage || !translation || translation === text) {
        return;
    }

    try {
        const keys = [];
        for (let index = 0; index < window.sessionStorage.length; index += 1) {
            const key = window.sessionStorage.key(index);
            if (key?.startsWith(`${CACHE_PREFIX}:`)) {
                keys.push(key);
            }
        }

        if (keys.length >= MAX_CACHE_ENTRIES) {
            keys.slice(0, keys.length - MAX_CACHE_ENTRIES + 1).forEach((key) => {
                window.sessionStorage.removeItem(key);
            });
        }

        window.sessionStorage.setItem(cacheStorageKey(from, to, text), JSON.stringify({
            value: translation,
            expires: Date.now() + CACHE_TTL_MS,
        }));
    } catch {
        // Ignore quota errors.
    }
}

function mergeCachedTranslations(from, to, texts) {
    const merged = {};
    texts.forEach((text) => {
        const cached = readCachedTranslation(from, to, text);
        if (cached) {
            merged[text] = cached;
        }
    });
    return merged;
}

function storeTranslationMap(from, to, map) {
    Object.entries(map || {}).forEach(([source, translated]) => {
        writeCachedTranslation(from, to, source, translated);
    });
}

export async function translateText(text, to, from = 'en') {
    const trimmed = String(text || '').trim();
    if (!trimmed || !to) {
        return trimmed;
    }

    const cached = readCachedTranslation(from, to, trimmed);
    if (cached) {
        return cached;
    }

    const response = await fetch('/tools/translate', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ text: trimmed, from, to }),
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : null;

    if (!response.ok) {
        const message = payload?.error || payload?.message || 'Translation failed';
        throw new Error(message);
    }

    const translation = payload?.translation || trimmed;
    writeCachedTranslation(from, to, trimmed, translation);

    return translation;
}

export async function translateBatch(texts, to, from = 'en') {
    const unique = [...new Set((texts || []).map((text) => String(text || '').trim()).filter(Boolean))];
    if (!unique.length || !to) {
        return Object.fromEntries(unique.map((text) => [text, text]));
    }

    const merged = mergeCachedTranslations(from, to, unique);
    const pending = unique.filter((text) => !merged[text]);

    if (!pending.length) {
        return merged;
    }

    const chunkSize = 40;

    for (let index = 0; index < pending.length; index += chunkSize) {
        const chunk = pending.slice(index, index + chunkSize);
        const response = await fetch('/tools/translate/batch', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                texts: chunk,
                from,
                to,
            }),
        });

        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
            ? await response.json()
            : null;

        if (!response.ok) {
            throw new Error(payload?.error || payload?.message || 'Translation failed');
        }

        const batch = payload?.translations || {};
        storeTranslationMap(from, to, batch);
        Object.assign(merged, batch);
    }

    return merged;
}
