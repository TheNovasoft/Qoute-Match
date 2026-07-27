import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import CategoryTabs from '@/Components/Admin/CategoryTabs';
import Pagination from '@/Components/Shared/Pagination';

/**
 * WordPress-style categories:
 * Main category list → Edit Subcategories opens that parent's children.
 */
export default function Index({ pageTitle, categories }) {
    const rows = categories?.data ?? [];
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="admin-categories admin-categories--wp">
                <CategoryTabs active="categories" />
                <p className="text-muted small mb-3">
                    Add a main category, then use <strong>Edit Subcategories</strong> to manage its children — same idea as WordPress.
                    Use <strong>Form Builder</strong> to create request/quote forms, then assign them here.
                </p>

                <div className="row gy-4">
                    <div className="col-lg-4">
                        <CategoryForm
                            key={editing?.id ?? 'new'}
                            categories={categories}
                            editing={editing}
                            onCancel={() => setEditing(null)}
                        />
                    </div>

                    <div className="col-lg-8">
                        <div className="card shadow-sm">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <h6 className="mb-0">Main Categories</h6>
                                <span className="text-muted small">{rows.length} categories</span>
                            </div>

                            <div className="admin-mobile-cards d-lg-none">
                                {rows.length === 0 ? (
                                    <p className="text-center text-muted py-4 mb-0">No categories yet. Add one on the left.</p>
                                ) : rows.map((row) => (
                                    <CategoryMobileCard key={row.id} row={row} onEdit={setEditing} />
                                ))}
                            </div>

                            <div className="table-responsive d-none d-lg-block">
                                <table className="table table--light style--two mb-0 admin-categories__tree-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Subcategories</th>
                                            <th>Jobs</th>
                                            <th>Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-muted py-4">
                                                    No categories yet. Add one on the left.
                                                </td>
                                            </tr>
                                        ) : rows.map((row) => (
                                            <CategoryRow key={row.id} row={row} onEdit={setEditing} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {categories?.links?.length > 3 && (
                                <div className="card-footer">
                                    <Pagination links={categories.links} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function CategoryMobileCard({ row, onEdit }) {
    const statusForm = useForm({});

    return (
        <article className="admin-mobile-card">
            <div className="admin-mobile-card__head">
                <span className="avatar avatar--sm">
                    <img src={row.image} alt="" />
                </span>
                <div className="admin-mobile-card__title">{row.name}</div>
                <span className={row.status.class}>{row.status.label}</span>
            </div>

            <div className="admin-mobile-card__meta admin-mobile-card__meta--single">
                <div className="admin-mobile-card__meta-item">
                    <span className="admin-mobile-card__meta-label">Subcategories</span>
                    <span className="admin-mobile-card__meta-value">{row.subcategoriesCount}</span>
                </div>
                <div className="admin-mobile-card__meta-item">
                    <span className="admin-mobile-card__meta-label">Jobs</span>
                    <span className="admin-mobile-card__meta-value">{row.jobsCount}</span>
                </div>
            </div>

            <div className="admin-mobile-card__actions admin-categories__actions">
                <Link href={row.subcategoriesUrl} className="btn btn-sm btn--primary admin-categories__btn admin-categories__btn--save">
                    Edit Subcategories
                </Link>
                <button type="button" className="btn btn-sm btn-outline--dark admin-categories__btn admin-categories__btn--dark" onClick={() => onEdit(row)}>
                    Edit
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline--warning admin-categories__btn admin-categories__btn--toggle"
                    disabled={statusForm.processing}
                    onClick={() => statusForm.post(row.statusUrl)}
                >
                    Toggle
                </button>
            </div>
        </article>
    );
}

function CategoryRow({ row, onEdit }) {
    const statusForm = useForm({});

    return (
        <tr>
            <td>
                <div className="admin-categories__parent">
                    <span className="avatar avatar--sm">
                        <img src={row.image} alt="" />
                    </span>
                    <div>
                        <div className="fw-semibold">{row.name}</div>
                        {(row.requestForm || row.quoteForm) && (
                            <div className="small text-muted">
                                {row.requestForm && <span className="me-2">Req: <code>{row.requestForm}</code></span>}
                                {row.quoteForm && <span>Quote: <code>{row.quoteForm}</code></span>}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <Link href={row.subcategoriesUrl} className="admin-categories__sub-link">
                    <span className="admin-categories__sub-count">{row.subcategoriesCount}</span>
                    <span>Edit Subcategories</span>
                </Link>
            </td>
            <td>{row.jobsCount}</td>
            <td>
                <span className={row.status.class}>{row.status.label}</span>
            </td>
            <td>
                <div className="admin-categories__actions justify-content-end">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline--dark admin-categories__btn admin-categories__btn--dark"
                        onClick={() => onEdit(row)}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline--warning admin-categories__btn admin-categories__btn--toggle"
                        disabled={statusForm.processing}
                        onClick={() => statusForm.post(row.statusUrl)}
                    >
                        Toggle
                    </button>
                </div>
            </td>
        </tr>
    );
}

function CategoryForm({ categories, editing, onCancel }) {
    const form = useForm({
        name: editing?.name ?? '',
        request_form_id: editing?.requestFormId ? String(editing.requestFormId) : '',
        quote_form_id: editing?.quoteFormId ? String(editing.quoteFormId) : '',
        image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(editing ? editing.storeUrl : categories.createUrl, {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                onCancel?.();
            },
        });
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white">
                <h6 className="mb-0">{editing ? 'Edit Category' : 'Add Category'}</h6>
            </div>
            <div className="card-body">
                <form onSubmit={submit}>
                    <div className="form-group mb-3">
                        <label>Name</label>
                        <input
                            className="form-control"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="e.g. Builders and Home Improvement"
                            required
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label>Request Form <span className="text-muted small">(optional)</span></label>
                        <select
                            className="form-control"
                            value={form.data.request_form_id}
                            onChange={(e) => form.setData('request_form_id', e.target.value)}
                        >
                            <option value="">— None —</option>
                            {(categories.formOptions?.request ?? []).map((f) => (
                                <option key={f.id} value={f.id}>{f.act}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-3">
                        <label>Quote Form <span className="text-muted small">(optional)</span></label>
                        <select
                            className="form-control"
                            value={form.data.quote_form_id}
                            onChange={(e) => form.setData('quote_form_id', e.target.value)}
                        >
                            <option value="">— None —</option>
                            {(categories.formOptions?.quote ?? []).map((f) => (
                                <option key={f.id} value={f.id}>{f.act}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-3">
                        <label>Image{editing ? ' (optional)' : ''}</label>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => form.setData('image', e.target.files[0])}
                        />
                    </div>
                    <div className="admin-categories__form-actions">
                        <button type="submit" className="btn btn--primary admin-categories__btn admin-categories__btn--save" disabled={form.processing}>
                            {editing ? 'Update' : 'Add Category'}
                        </button>
                        {editing && (
                            <button type="button" className="btn btn-outline--dark admin-categories__btn admin-categories__btn--dark" onClick={onCancel}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
