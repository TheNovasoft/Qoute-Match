import { Link, usePage } from '@inertiajs/react';

/**
 * Apple-style pill tabs. Uses the same routes as the sidebar submenu so
 * clicking a tab also highlights the matching sidebar item.
 * Supports query-string tabs (e.g. ?status=pending) as well as path tabs.
 */
export default function AdminStatusTabs({ tabs = [], active, className = '' }) {
    const pageUrl = usePage().url || '';
    const path = (pageUrl.split('?')[0] || '').replace(/\/$/, '') || '/';
    const currentParams = new URLSearchParams(pageUrl.includes('?') ? pageUrl.split('?')[1] : '');

    const resolvedActive = (() => {
        const scored = [];

        tabs.forEach((tab) => {
            const href = String(tab.href || '');
            const [rawPath, rawQuery = ''] = href.split('?');
            const tabPath = (rawPath || '').replace(/\/$/, '') || '/';
            if (!tabPath) return;

            if (path === tabPath) {
                if (rawQuery) {
                    const tabParams = new URLSearchParams(rawQuery);
                    let matchesQuery = true;
                    tabParams.forEach((value, key) => {
                        if ((currentParams.get(key) || '') !== value) {
                            matchesQuery = false;
                        }
                    });
                    if (matchesQuery) {
                        scored.push({ key: tab.key, score: 2000 + rawQuery.length });
                    }
                } else {
                    scored.push({ key: tab.key, score: 1000 + tabPath.length });
                }
                return;
            }

            if (tabPath !== '/' && path.startsWith(`${tabPath}/`)) {
                scored.push({ key: tab.key, score: tabPath.length });
            }
        });

        scored.sort((a, b) => b.score - a.score);

        const queryHit = scored.find((item) => item.score >= 2000);
        if (queryHit) {
            return queryHit.key;
        }

        const pathHits = scored.filter((item) => item.score >= 1000 && item.score < 2000);
        if (pathHits.length === 1) {
            return pathHits[0].key;
        }
        if (pathHits.length > 1 && active && tabs.some((tab) => tab.key === active)) {
            return active;
        }
        if (pathHits.length > 0) {
            return pathHits[0].key;
        }

        if (scored.length) {
            return scored[0].key;
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
