import { router } from '@inertiajs/react';

/**
 * Return to the list tab the admin came from.
 * Prefer the scoped indexUrl from the detail payload (set via ?scope= / ?status=).
 */
export function adminGoBack(e, fallbackUrl) {
    e?.preventDefault?.();

    if (fallbackUrl) {
        router.visit(fallbackUrl);
        return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
    }
}
