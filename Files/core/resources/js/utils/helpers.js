export function asset(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = window.location.origin;
    return `${base}/${path.replace(/^\//, '')}`;
}

/** Match current Inertia URL to a sidebar href (admin-style active states). */
export function isNavActive(currentUrl, href, { exact = false } = {}) {
    if (!href || !currentUrl) return false;
    let path = String(href);
    try {
        path = new URL(path, window.location.origin).pathname;
    } catch {
        path = path.split('?')[0].split('#')[0];
    }
    path = path.replace(/\/+$/, '') || '/';
    const url = String(currentUrl).split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    if (exact) return url === path;
    return url === path || url.startsWith(`${path}/`);
}

export function templateAsset(path, templatePath) {
    return asset(`${templatePath}${path}`);
}

export function highlightText(text, breakIndex = -1, length = 1) {
    if (!text) return '';
    const words = text.trim().split(' ');
    const total = words.length;
    const start = breakIndex < 0 ? Math.max(0, total + breakIndex) : breakIndex;
    const end = Math.min(total, start + length);

    return words
        .map((word, index) =>
            index >= start && index < end ? `<span class="text--base">${word}</span>` : word
        )
        .join(' ');
}

export function applyHighlights() {
    document.querySelectorAll('.highlight .s-highlight:not([data-highlighted])').forEach((heading) => {
        const text = heading.textContent.trim();
        if (!text) return;

        const breakValue = parseInt(heading.dataset.sBreak, 10) || 0;
        const lengthValue = parseInt(heading.dataset.sLength, 10) || 1;
        heading.innerHTML = highlightText(text, breakValue, lengthValue);
        heading.setAttribute('data-highlighted', 'true');
    });
}

export function notify(status, message) {
    const fire = () => {
        if (typeof window.notify === 'function') {
            window.notify(status, message);
            return true;
        }
        return false;
    };

    if (fire()) {
        return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
        if (fire() || ++attempts > 30) {
            clearInterval(interval);
        }
    }, 100);
}
