const STORAGE_KEY = 'sidebar-nav-mode';

export function getSidebarNavMode() {
    if (typeof window === 'undefined') return 'simple';
    return localStorage.getItem(STORAGE_KEY) === 'advanced' ? 'advanced' : 'simple';
}

export function setSidebarNavMode(mode) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, mode === 'advanced' ? 'advanced' : 'simple');
}

export function toggleSidebarNavMode() {
    const next = getSidebarNavMode() === 'simple' ? 'advanced' : 'simple';
    setSidebarNavMode(next);
    return next;
}
