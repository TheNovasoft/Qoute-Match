import { Link } from '@inertiajs/react';

export default function AdminStatusTabs({ tabs = [], active }) {
    if (!tabs.length) return null;

    return (
        <div className="admin-status-tabs btn-group flex-wrap mb-3" role="tablist">
            {tabs.map((tab) => {
                const isActive = active === tab.key;
                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className={`btn btn-sm ${isActive ? 'btn--primary' : 'btn-outline--primary'} mb-1`}
                        preserveScroll
                    >
                        {tab.label}
                        {tab.count != null && Number(tab.count) > 0 ? (
                            <span className="badge bg-light text-dark ms-1">{tab.count}</span>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
}
