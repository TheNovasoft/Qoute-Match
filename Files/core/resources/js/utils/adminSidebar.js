/**
 * Keep Blade admin sidebar in sync with Inertia navigations.
 * The sidebar lives outside the Inertia root, so server-rendered
 * "active" classes never update on XHR page swaps unless we do it here.
 */
export function syncAdminSidebar(url = window.location.href) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let path;
    try {
        path = new URL(url, window.location.origin).pathname.replace(/\/+$/, '') || '/';
    } catch {
        return;
    }

    const links = Array.from(sidebar.querySelectorAll('a.nav-link[href]'));
    let best = null;
    let bestScore = -1;

    links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;

        let linkPath;
        try {
            linkPath = new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
        } catch {
            return;
        }

        let score = -1;
        if (path === linkPath) {
            score = linkPath.length + 1000; // exact match wins
        } else if (linkPath !== '/' && path.startsWith(`${linkPath}/`)) {
            score = linkPath.length;
        }

        if (score > bestScore) {
            bestScore = score;
            best = link;
        }
    });

    // Clear previous highlights (no animated close — avoids jump)
    sidebar.querySelectorAll('.sidebar-menu-item').forEach((el) => el.classList.remove('active'));
    sidebar.querySelectorAll('.sidebar-dropdown > a').forEach((el) => {
        el.classList.remove('side-menu--open');
        el.querySelector('.side-menu__sub-icon')?.classList.remove('transform', 'rotate-180');
    });
    sidebar.querySelectorAll('.sidebar-submenu').forEach((el) => {
        el.classList.remove('sidebar-submenu__open');
        el.style.display = 'none';
    });

    if (!best) return;

    const item = best.closest('.sidebar-menu-item');
    item?.classList.add('active');

    const submenu = best.closest('.sidebar-submenu');
    if (submenu) {
        submenu.classList.add('sidebar-submenu__open');
        submenu.style.display = 'block';

        const dropdown = submenu.closest('.sidebar-dropdown');
        const trigger = dropdown
            ? Array.from(dropdown.children).find((el) => el.tagName === 'A')
            : null;
        trigger?.classList.add('side-menu--open');
        trigger?.querySelector('.side-menu__sub-icon')?.classList.add('transform', 'rotate-180');
    }
}

export function bindAdminSidebarSync(router) {
    const run = (event) => {
        const url = event?.detail?.page?.url || window.location.href;
        // next frame so DOM/content settle without scroll animation jump
        requestAnimationFrame(() => syncAdminSidebar(url));
    };

    router.on('navigate', run);
    router.on('success', run);
    router.on('finish', run);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => syncAdminSidebar());
    } else {
        syncAdminSidebar();
    }
}
