import { Link, usePage } from '@inertiajs/react';

/**
 * Apple-style pill tabs. Uses the same routes as the sidebar submenu so
 * clicking a tab also highlights the matching sidebar item.
 */
export default function AdminStatusTabs({ tabs = [], active, className = '' }) {
    const pageUrl = usePage().url || '';
    const path = pageUrl.split('?')[0];

    const resolvedActive = (() => {
        const matches = tabs
            .map((tab) => ({
                key: tab.key,
                href: String(tab.href || '').split('?')[0],
            }))
            .filter((tab) => tab.href && (path === tab.href || path.startsWith(`${tab.href}/`)))
            .sort((a, b) => b.href.length - a.href.length);

        if (matches.length) {
            return matches[0].key;
        }

        return active;
    })();

    return (
        <div className={`admin-status-tabs ${className}`.trim()} role="tablist">
            {tabs.map((tab) => {
                const isActive = resolvedActive === tab.key;
                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        role="tab"
                        aria-selected={isActive}
                        className={`admin-status-tabs__tab${isActive ? ' is-active' : ''}`}
                        preserveScroll
                    >
                        {tab.label}
                        {tab.badge != null && tab.badge !== '' ? (
                            <span className="admin-status-tabs__badge">{tab.badge}</span>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
}
