import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import CategoryTabs from '@/Components/Admin/CategoryTabs';
import Pagination from '@/Components/Shared/Pagination';

export default function Index({ pageTitle, forms }) {
    const rows = forms?.data ?? [];
    const createForm = useForm({ type: 'request', slug: '' });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(forms.createUrl);
    };

    return (
        <AdminLayout pageTitle={pageTitle}>
            <CategoryTabs active="forms" />

            <div className="row g-3 align-items-end mb-4">
                <div className="col-lg-5">
                    <div className="btn-group flex-wrap">
                        <Link href="/admin/marketplace-forms" className={`btn btn-sm ${!forms.type ? 'btn--primary' : 'btn-outline--primary'}`}>All</Link>
                        <Link href="/admin/marketplace-forms?type=request" className={`btn btn-sm ${forms.type === 'request' ? 'btn--primary' : 'btn-outline--primary'}`}>Request</Link>
                        <Link href="/admin/marketplace-forms?type=quote" className={`btn btn-sm ${forms.type === 'quote' ? 'btn--primary' : 'btn-outline--primary'}`}>Quote</Link>
                    </div>
                </div>
                <div className="col-lg-7">
                    <form className="row g-2 align-items-center justify-content-lg-end" onSubmit={submitCreate}>
                        <div className="col-6 col-sm-3 col-md-auto">
                            <select
                                className="form-control form--control"
                                value={createForm.data.type}
                                onChange={(e) => createForm.setData('type', e.target.value)}
                            >
                                <option value="request">Request</option>
                                <option value="quote">Quote</option>
                            </select>
                        </div>
                        <div className="col-6 col-sm-5 col-md">
                            <input
                                className="form-control form--control"
                                placeholder="slug_key (e.g. kitchen)"
                                value={createForm.data.slug}
                                onChange={(e) => createForm.setData('slug', e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-12 col-sm-4 col-md-auto">
                            <button
                                type="submit"
                                className="btn btn--primary w-100 text-nowrap px-4"
                                disabled={createForm.processing}
                            >
                                {createForm.processing ? 'Creating…' : 'Create'}
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
                            if (window.confirm('Delete form?')) deleteForm.post(row.deleteUrl);
                        }}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
