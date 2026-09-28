import { router } from '@inertiajs/react';

function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function sameOriginHref(href) {
    if (!href || href.startsWith('javascript:') || href === '#') {
        return null;
    }
    try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) {
            return null;
        }
        return url.pathname + url.search + url.hash;
    } catch (_) {
        return null;
    }
}

export function adminInertiaVisit(href, options = {}) {
    const target = sameOriginHref(href);
    if (!target) {
        return;
    }

    router.visit(target, {
        preserveState: false,
        preserveScroll: options.preserveScroll ?? true,
        replace: options.replace ?? false,
    });
}

let adminSidebarNavBound = false;

/**
 * Blade sidebar links sit outside the React tree; force Inertia visits so
 * admin list pages (reviews, bids, deposits, …) always load the correct URL.
 */
export function bindAdminSidebarInertiaNav() {
    if (adminSidebarNavBound || !document.body.classList.contains('admin-panel')) {
        return;
    }

    adminSidebarNavBound = true;

    document.addEventListener(
        'click',
        (event) => {
            if (!document.body.classList.contains('admin-panel') || isModifiedClick(event)) {
                return;
            }

            const link = event.target.closest('.sidebar a[href]');
            if (!link || link.getAttribute('data-inertia') === 'false') {
                return;
            }

            const dropdown = link.closest('.sidebar-dropdown');
            if (
                dropdown
                && dropdown.querySelector(':scope > .sidebar-submenu')
                && link === dropdown.querySelector(':scope > a')
            ) {
                return;
            }

            const target = sameOriginHref(link.getAttribute('href'));
            if (!target) {
                return;
            }

            if (link.classList.contains('nav-link') || link.closest('.sidebar-menu-item')) {
                event.preventDefault();
                event.stopPropagation();
                adminInertiaVisit(target, { preserveScroll: false });
            }
        },
        true,
    );
}
