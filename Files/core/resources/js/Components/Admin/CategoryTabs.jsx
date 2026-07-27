import { Link, usePage } from '@inertiajs/react';

const TABS = [
    { key: 'categories', label: 'Categories', href: '/admin/category/index', match: ['/admin/category/index'] },
    { key: 'subcategories', label: 'Subcategories', href: '/admin/category/subcategories', match: ['/admin/category/subcategories'] },
    { key: 'skills', label: 'Skills', href: '/admin/category/skills', match: ['/admin/category/skills'] },
    { key: 'forms', label: 'Form Builder', href: '/admin/marketplace-forms', match: ['/admin/marketplace-forms'] },
];

export default function CategoryTabs({ active }) {
    const url = usePage().url || '';

    return (
        <ul className="nav nav-tabs mb-4 admin-categories__tabs" role="tablist">
            {TABS.map((tab) => {
                const isActive = active
                    ? active === tab.key
                    : tab.match.some((path) => url.startsWith(path));

                return (
                    <li key={tab.key} className={`nav-item ${isActive ? 'active' : ''}`} role="presentation">
                        <Link
                            href={tab.href}
                            className={`nav-link text-dark ${isActive ? 'active' : ''}`}
                            preserveScroll
                        >
                            {tab.label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
