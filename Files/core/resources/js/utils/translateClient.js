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

export async function translateText(text, to, from = 'auto') {
    const trimmed = String(text || '').trim();
    if (!trimmed || !to) {
        return trimmed;
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

    return payload?.translation || trimmed;
}

export async function translateBatch(texts, to, from = 'auto') {
    const unique = [...new Set((texts || []).map((text) => String(text || '').trim()).filter(Boolean))];
    if (!unique.length || !to) {
        return Object.fromEntries(unique.map((text) => [text, text]));
    }

    const merged = {};
    const chunkSize = 40;

    for (let index = 0; index < unique.length; index += chunkSize) {
        const chunk = unique.slice(index, index + chunkSize);
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

        Object.assign(merged, payload?.translations || {});
    }

    return merged;
}
