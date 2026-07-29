import { Link, usePage } from '@inertiajs/react';

const TABS = [
    { key: 'categories', label: 'Categories', href: '/admin/category/index', match: ['/admin/category/index', '/admin/category'] },
    { key: 'subcategories', label: 'Subcategories', href: '/admin/category/subcategories', match: ['/admin/category/subcategories'] },
    { key: 'skills', label: 'Skills', href: '/admin/category/skills', match: ['/admin/category/skills'] },
    { key: 'forms', label: 'Form Builder', href: '/admin/marketplace-forms', match: ['/admin/marketplace-forms'] },
];

export default function CategoryTabs({ active }) {
    const rawUrl = usePage().url || '';
    const url = rawUrl.split('?')[0];

    return (
        <div className="admin-status-tabs btn-group flex-wrap mb-4" role="tablist">
            {TABS.map((tab) => {
                const isActive = active
                    ? active === tab.key
                    : tab.match.some((path) => url === path || url.startsWith(`${path}/`) || url.startsWith(path));

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className={`btn btn-sm ${isActive ? 'btn--primary' : 'btn-outline--primary'} mb-1`}
                        preserveScroll
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
