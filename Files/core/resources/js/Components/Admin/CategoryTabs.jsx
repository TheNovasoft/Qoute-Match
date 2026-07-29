import { usePage } from '@inertiajs/react';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';

const TABS = [
    { key: 'categories', label: 'Categories', href: '/admin/category/index', match: ['/admin/category/index'] },
    { key: 'subcategories', label: 'Subcategories', href: '/admin/category/subcategories', match: ['/admin/category/subcategories'] },
    { key: 'skills', label: 'Skills', href: '/admin/category/skills', match: ['/admin/category/skills'] },
    { key: 'forms', label: 'Form Builder', href: '/admin/marketplace-forms', match: ['/admin/marketplace-forms'] },
];

export default function CategoryTabs({ active }) {
    const url = usePage().url || '';

    const resolvedActive = active
        || TABS.find((tab) => tab.match.some((path) => url.startsWith(path)))?.key
        || 'categories';

    return (
        <AdminStatusTabs
            className="mb-4"
            active={resolvedActive}
            tabs={TABS.map(({ key, label, href }) => ({ key, label, href }))}
        />
    );
}
