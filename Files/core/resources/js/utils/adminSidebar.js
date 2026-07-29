/**
 * Keep Blade admin sidebar active state in sync with Inertia tab/nav clicks.
 */
export function syncAdminSidebar(pathname = window.location.pathname) {
    const path = String(pathname || '').replace(/\/+$/, '') || '/';
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const items = Array.from(sidebar.querySelectorAll('li.sidebar-menu-item'));
    items.forEach((item) => item.classList.remove('active'));

    const submenuLinks = Array.from(
        sidebar.querySelectorAll('.sidebar-submenu a.nav-link[href]')
    );

    let best = null;
    submenuLinks.forEach((link) => {
        try {
            const hrefPath = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
            if (path === hrefPath || path.startsWith(`${hrefPath}/`)) {
                if (!best || hrefPath.length > best.hrefPath.length) {
                    best = { link, hrefPath };
                }
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
                if (path === hrefPath || path.startsWith(`${hrefPath}/`)) {
                    if (!best || hrefPath.length > best.hrefPath.length) {
                        best = { link, hrefPath };
                    }
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
    if (dropdown) {
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
}

export function bindAdminSidebarSync(router) {
    const run = () => syncAdminSidebar(window.location.pathname);
    run();
    if (!router?.on) return;
    router.on('navigate', run);
    router.on('finish', run);
}
