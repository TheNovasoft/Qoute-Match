import { usePage } from '@inertiajs/react';
import { adminInertiaVisit } from '@/utils/adminInertiaNav';

function normalizePath(href) {
    const raw = String(href || '').split('?')[0].trim();
    if (!raw) {
        return '/';
    }
    try {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
            return new URL(raw).pathname.replace(/\/+$/, '') || '/';
        }
    } catch (_) {
        // ignore
    }
    return raw.replace(/\/+$/, '') || '/';
}

function normalizePagePath(pageUrl) {
    const raw = String(pageUrl || '').split('?')[0].trim() || '/';
    return normalizePath(raw.startsWith('/') ? raw : `/${raw}`);
}

/**
 * Apple-style pill tabs. Prefer the server `active` key (e.g. reviews.status).
 */
export default function AdminStatusTabs({ tabs = [], active, className = '' }) {
    const pageUrl = usePage().url || '';
    const path = normalizePagePath(pageUrl);
    const query = pageUrl.includes('?') ? pageUrl.split('?')[1] : '';
    const currentParams = new URLSearchParams(query);

    const resolvedActive = (() => {
        if (active != null && active !== '' && tabs.some((tab) => tab.key === active)) {
            return active;
        }

        let best = null;

        tabs.forEach((tab) => {
            const href = String(tab.href || '');
            const [rawPath, rawQuery = ''] = href.split('?');
            const tabPath = normalizePath(rawPath);
            if (!tabPath) {
                return;
            }

            if (path !== tabPath) {
                return;
            }

            if (rawQuery) {
                const tabParams = new URLSearchParams(rawQuery);
                let matchesQuery = true;
                tabParams.forEach((value, key) => {
                    if ((currentParams.get(key) || '') !== value) {
                        matchesQuery = false;
                    }
                });
                if (!matchesQuery) {
                    return;
                }
            }

            const score = 1000 + tabPath.length + rawQuery.length;
            if (!best || score > best.score) {
                best = { key: tab.key, score };
            }
        });

        if (best) {
            return best.key;
        }

        return active ?? tabs[0]?.key;
    })();

    const onTabClick = (event, href) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        event.preventDefault();
        adminInertiaVisit(href, { preserveScroll: true });
    };

    return (
        <div className={`admin-status-tabs ${className}`.trim()} role="tablist">
            {tabs.map((tab) => {
                const isActive = resolvedActive === tab.key;
                return (
                    <a
                        key={tab.key}
                        href={tab.href}
                        role="tab"
                        aria-selected={isActive}
                        className={`admin-status-tabs__tab${isActive ? ' is-active' : ''}`}
                        onClick={(event) => onTabClick(event, tab.href)}
                    >
                        {tab.label}
                        {tab.badge != null && tab.badge !== '' ? (
                            <span className="admin-status-tabs__badge">{tab.badge}</span>
                        ) : tab.count != null && Number(tab.count) > 0 ? (
                            <span className="admin-status-tabs__badge">{tab.count}</span>
                        ) : null}
                    </a>
                );
            })}
        </div>
    );
}
