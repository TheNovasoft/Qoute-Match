import { usePage } from '@inertiajs/react';

/**
 * Resolve UI copy from shared locale.strings (ur.json / en.json).
 */
export function useT() {
    const { locale } = usePage().props;
    const strings = locale?.strings ?? {};

    return (key, fallback = key) => {
        if (!key) {
            return fallback;
        }
        return strings[key] || fallback;
    };
}
