import { bindAdminSidebarInertiaNav } from '@/utils/adminInertiaNav';

/**
 * Keep Blade admin sidebar active state in sync with Inertia tab/nav clicks.
 * Avoid re-toggling already-open submenus (prevents jump/flash).
 */
function scoreSidebarPath(path, hrefPath) {
    if (!hrefPath || hrefPath === '#') {
        return 0;
    }
    if (path === hrefPath) {
        return 10_000 + hrefPath.length;
    }
    if (hrefPath !== '/' && path.startsWith(`${hrefPath}/`)) {
        return hrefPath.length;
    }
    return 0;
}

function resetSidebarMenuState(sidebar) {
    sidebar.querySelectorAll('li.sidebar-menu-item').forEach((item) => item.classList.remove('active'));
    sidebar.querySelectorAll('.sidebar-dropdown').forEach((dropdown) => {
        dropdown.classList.remove('active');
        const trigger = dropdown.querySelector(':scope > a');
        const submenu = dropdown.querySelector(':scope > .sidebar-submenu');
        if (trigger) {
            trigger.classList.remove('side-menu--open');
            trigger.querySelector('.side-menu__sub-icon')?.classList.remove('transform', 'rotate-180');
        }
        if (submenu) {
            submenu.classList.remove('sidebar-submenu__open');
            submenu.style.display = 'none';
        }
    });
}

export function syncAdminSidebar(pathname = window.location.pathname) {
    const path = String(pathname || '').replace(/\/+$/, '') || '/';
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    resetSidebarMenuState(sidebar);

    const submenuLinks = Array.from(
        sidebar.querySelectorAll('.sidebar-submenu a.nav-link[href]')
    );

    let best = null;
    submenuLinks.forEach((link) => {
        try {
            const hrefPath = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
            const score = scoreSidebarPath(path, hrefPath);
            if (score && (!best || score > best.score)) {
                best = { link, hrefPath, score };
            }
        } catch (_) {
            // ignore invalid href
        }
    });

    if (!best) {
        const topLinks = Array.from(sidebar.querySelectorAll('li.sidebar-menu-item:not(.sidebar-dropdown) > a.nav-link[href]'));
        topLinks.forEach((link) => {
            try {
                const hrefPath = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
                const score = scoreSidebarPath(path, hrefPath);
                if (score && (!best || score > best.score)) {
                    best = { link, hrefPath, score };
                }
            } catch (_) {
                // ignore
            }
        });
    }

    if (!best) return;

    const item = best.link.closest('li.sidebar-menu-item');
    if (item) item.classList.add('active');

    const dropdown = best.link.closest('li.sidebar-dropdown');
    if (!dropdown) return;

    dropdown.classList.add('active');
    const trigger = dropdown.querySelector(':scope > a');
    const submenu = dropdown.querySelector(':scope > .sidebar-submenu');

    if (trigger) {
        trigger.classList.add('side-menu--open');
        const icon = trigger.querySelector('.side-menu__sub-icon');
        if (icon) icon.classList.add('transform', 'rotate-180');
    }

    if (submenu) {
        submenu.classList.add('sidebar-submenu__open');
        submenu.style.display = 'block';
    }
}

let adminSidebarMobileBound = false;

export function bindAdminSidebarInteractions() {
    if (adminSidebarMobileBound) {
        return;
    }

    adminSidebarMobileBound = true;

    // Dropdown toggle is handled by assets/admin/js/app.js (jQuery). A duplicate
    // listener here caused open-then-close on every click on Inertia admin pages.

    document.querySelector('.sidebar-mobile-overlay')?.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-mobile-overlay')?.classList.remove('show');
        document.body.classList.remove('sidebar-open');
    });
}

let sidebarSyncTimer = null;

export function bindAdminSidebarSync(router) {
    const run = (event) => {
        bindAdminSidebarInteractions();
        bindAdminSidebarInertiaNav();

        let path = window.location.pathname;
        const pageUrl = event?.detail?.page?.url;
        if (pageUrl) {
            try {
                path = new URL(pageUrl, window.location.origin).pathname;
            } catch (_) {
                // keep pathname fallback
            }
        }

        if (sidebarSyncTimer) {
            clearTimeout(sidebarSyncTimer);
        }
        sidebarSyncTimer = setTimeout(() => {
            sidebarSyncTimer = null;
            syncAdminSidebar(path);
        }, 0);
    };

    run();
    if (!router?.on) return;
    // Do not sync on "navigate" — page.url is still the previous route and breaks Review tabs.
    router.on('success', run);
    router.on('finish', run);
}
