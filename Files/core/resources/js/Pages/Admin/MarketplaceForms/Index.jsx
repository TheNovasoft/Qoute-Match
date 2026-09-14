import { useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import CategoryTabs from '@/Components/Admin/CategoryTabs';
import Pagination from '@/Components/Shared/Pagination';

const TYPE_TABS = [
    { key: 'all', label: 'All', href: '/admin/marketplace-forms' },
    { key: 'request', label: 'Request', href: '/admin/marketplace-forms?type=request' },
    { key: 'quote', label: 'Quote', href: '/admin/marketplace-forms?type=quote' },
];

export default function Index({ pageTitle, forms }) {
    const rows = forms?.data ?? [];
    const csrfToken = usePage().props?.csrfToken ?? '';

    useEffect(() => {
        const reloadForms = () => {
            router.reload({ only: ['forms'], preserveScroll: true });
        };

        const onPageShow = (event) => {
            if (event.persisted) {
                reloadForms();
            }
        };

        window.addEventListener('pageshow', onPageShow);

        return () => window.removeEventListener('pageshow', onPageShow);
    }, []);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <CategoryTabs active="forms" />

            <div className="row g-3 align-items-end mb-4">
                <div className="col-lg-5">
                    <AdminStatusTabs
                        tabs={TYPE_TABS}
                        active={forms.type || 'all'}
                    />
                </div>
                <div className="col-lg-7">
                    <form
                        method="post"
                        action={forms.createUrl}
                        className="row g-2 align-items-center justify-content-lg-end"
                    >
                        <input type="hidden" name="_token" value={csrfToken} />
                        <div className="col-6 col-sm-3 col-md-auto">
                            <select
                                name="type"
                                className="form-control form--control"
                                defaultValue={forms.type === 'quote' ? 'quote' : 'request'}
                            >
                                <option value="request">Request</option>
                                <option value="quote">Quote</option>
                            </select>
                        </div>
                        <div className="col-6 col-sm-5 col-md">
                            <input
                                name="slug"
                                className="form-control form--control"
                                placeholder="slug_key (e.g. kitchen_test)"
                                pattern="[a-z0-9_]+"
                                title="Lowercase letters, numbers, and underscore only"
                                required
                            />
                        </div>
                        <div className="col-12 col-sm-4 col-md-auto">
                            <button type="submit" className="btn btn--primary w-100 text-nowrap px-4">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Type</th>
                                <th>Fields</th>
                                <th>Categories</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-4">No forms found.</td></tr>
                            ) : rows.map((row) => (
                                <FormRow key={row.id} row={row} />
                            ))}
                        </tbody>
                    </table>
                </div>
                {forms?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={forms.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}

function FormRow({ row }) {
    const deleteForm = useForm({});

    return (
        <tr>
            <td><code>{row.act}</code></td>
            <td className="text-capitalize">{row.type}</td>
            <td>{row.fieldsCount}</td>
            <td className="small">{(row.categories ?? []).join(', ') || '—'}</td>
            <td>
                <div className="d-flex flex-wrap gap-1">
                    {/* Full page visit — edit screen is Blade, not Inertia */}
                    <a href={row.editUrl} className="btn btn-sm btn-outline--primary" data-inertia="false">
                        Edit
                    </a>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline--danger"
                        disabled={deleteForm.processing}
                        onClick={() => {
                            if (!window.confirm('Delete form?')) return;
                            deleteForm.post(row.deleteUrl, {
                                preserveScroll: true,
                                onSuccess: () => router.reload({ only: ['forms'] }),
                            });
                        }}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
