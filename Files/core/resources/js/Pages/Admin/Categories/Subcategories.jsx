import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import CategoryTabs from '@/Components/Admin/CategoryTabs';
import Pagination from '@/Components/Shared/Pagination';

/**
 * Subcategories under one parent category (WordPress-style children).
 */
export default function Subcategories({ pageTitle, subcategories }) {
    const rows = subcategories?.data ?? [];
    const parent = subcategories?.parent ?? null;
    const [editing, setEditing] = useState(null);
    const lockedCategoryId = parent?.id ? String(parent.id) : '';

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="admin-categories admin-categories--wp">
                <CategoryTabs active="subcategories" />
                <div className="admin-categories__breadcrumb mb-3">
                    <Link href={subcategories.categoriesUrl ?? '/admin/category/index'} className="btn btn-sm btn-outline--dark admin-categories__btn admin-categories__btn--dark">
                        ← All Categories
                    </Link>
                    {parent && (
                        <span className="admin-categories__crumb">
                            <span className="text-muted">/</span>
                            <strong>{parent.name}</strong>
                            <span className="text-muted">→ Subcategories</span>
                        </span>
                    )}
                </div>

                {parent && (
                    <div className="alert alert-light border mb-3 py-2">
                        Managing subcategories for <strong>{parent.name}</strong>. Add a child below, or edit an existing one.
                    </div>
                )}

                <div className="row gy-4">
                    <div className="col-lg-4">
                        <SubcategoryForm
                            key={editing?.id ?? `new-${lockedCategoryId}`}
                            subcategories={subcategories}
                            editing={editing}
                            lockedCategoryId={lockedCategoryId}
                            onCancel={() => setEditing(null)}
                        />
                    </div>

                    <div className="col-lg-8">
                        <div className="card shadow-sm">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <h6 className="mb-0">
                                    {parent ? `Subcategories of ${parent.name}` : 'All Subcategories'}
                                </h6>
                                <span className="text-muted small">{rows.length} items</span>
                            </div>

                            <div className="admin-mobile-cards d-lg-none">
                                {rows.length === 0 ? (
                                    <p className="text-center text-muted py-4 mb-0">No subcategories yet. Add one on the left.</p>
                                ) : rows.map((row) => (
                                    <SubcategoryMobileCard key={row.id} row={row} hideCategory={!!parent} onEdit={setEditing} />
                                ))}
                            </div>

                            <div className="table-responsive d-none d-lg-block">
                                <table className="table table--light style--two mb-0">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            {!parent && <th>Parent Category</th>}
                                            <th>Jobs</th>
                                            <th>Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={parent ? 4 : 5} className="text-center text-muted py-4">
                                                    No subcategories yet. Add one on the left.
                                                </td>
                                            </tr>
                                        ) : rows.map((row) => (
                                            <SubcategoryRow key={row.id} row={row} hideCategory={!!parent} onEdit={setEditing} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {subcategories?.links?.length > 3 && (
                                <div className="card-footer">
                                    <Pagination links={subcategories.links} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function SubcategoryMobileCard({ row, hideCategory, onEdit }) {
    const statusForm = useForm({});

    return (
        <article className="admin-mobile-card">
            <div className="admin-mobile-card__head">
                <div className="admin-mobile-card__title">{row.name}</div>
                <span className={row.status.class}>{row.status.label}</span>
            </div>
            <div className="admin-mobile-card__meta admin-mobile-card__meta--single">
                {!hideCategory && (
                    <div className="admin-mobile-card__meta-item">
                        <span className="admin-mobile-card__meta-label">Parent</span>
                        <span className="admin-mobile-card__meta-value">{row.category}</span>
                    </div>
                )}
                <div className="admin-mobile-card__meta-item">
                    <span className="admin-mobile-card__meta-label">Jobs</span>
                    <span className="admin-mobile-card__meta-value">{row.jobsCount}</span>
                </div>
            </div>
            <div className="admin-mobile-card__actions admin-categories__actions">
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

function SubcategoryRow({ row, hideCategory, onEdit }) {
    const statusForm = useForm({});

    return (
        <tr>
            <td>
                <span className="admin-categories__child-name">— {row.name}</span>
            </td>
            {!hideCategory && <td>{row.category}</td>}
            <td>{row.jobsCount}</td>
            <td>
                <span className={row.status.class}>{row.status.label}</span>
            </td>
            <td>
                <div className="admin-categories__actions justify-content-end">
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
            </td>
        </tr>
    );
}

function SubcategoryForm({ subcategories, editing, lockedCategoryId, onCancel }) {
    const defaultCategoryId = lockedCategoryId
        || (editing?.categoryId ? String(editing.categoryId) : '');

    const form = useForm({
        name: editing?.name ?? '',
        category_id: defaultCategoryId,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(editing ? editing.storeUrl : subcategories.createUrl, {
            onSuccess: () => {
                form.reset('name');
                if (lockedCategoryId) {
                    form.setData('category_id', lockedCategoryId);
                }
                onCancel?.();
            },
        });
    };

    const parentName = lockedCategoryId
        ? (subcategories.categories ?? []).find((c) => String(c.id) === String(lockedCategoryId))?.name
            || subcategories.parent?.name
        : null;

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white">
                <h6 className="mb-0">{editing ? 'Edit Subcategory' : 'Add Subcategory'}</h6>
            </div>
            <div className="card-body">
                <form onSubmit={submit}>
                    <div className="form-group mb-3">
                        <label>Parent Category</label>
                        {lockedCategoryId ? (
                            <>
                                <input className="form-control" value={parentName || '—'} disabled readOnly />
                                <input type="hidden" value={form.data.category_id} />
                            </>
                        ) : (
                            <select
                                className="form-control"
                                value={form.data.category_id}
                                onChange={(e) => form.setData('category_id', e.target.value)}
                                required
                            >
                                <option value="">Select parent category</option>
                                {(subcategories.categories ?? []).map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="form-group mb-3">
                        <label>Name</label>
                        <input
                            className="form-control"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="e.g. Kitchen Remodeling"
                            required
                        />
                    </div>
                    <div className="admin-categories__form-actions">
                        <button type="submit" className="btn btn--primary admin-categories__btn admin-categories__btn--save" disabled={form.processing}>
                            {editing ? 'Update' : 'Add Subcategory'}
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
