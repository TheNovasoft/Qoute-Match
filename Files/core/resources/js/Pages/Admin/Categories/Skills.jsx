import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import CategoryTabs from '@/Components/Admin/CategoryTabs';
import Pagination from '@/Components/Shared/Pagination';

export default function Skills({ pageTitle, skills, categories = [] }) {
    const rows = skills?.data ?? [];
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="admin-categories">
            <CategoryTabs active="skills" />
            <div className="row gy-4">
                <div className="col-lg-4">
                    <SkillForm
                        skills={skills}
                        categories={categories}
                        editing={editing}
                        onCancel={() => setEditing(null)}
                    />
                </div>
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="admin-mobile-cards d-lg-none">
                            {rows.length === 0 ? (
                                <p className="text-center text-muted py-4 mb-0">No skills found.</p>
                            ) : rows.map((row) => (
                                <SkillMobileCard key={row.id} row={row} onEdit={setEditing} />
                            ))}
                        </div>

                        <div className="table-responsive d-none d-lg-block">
                            <table className="table table--light style--two mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center text-muted py-4">No skills found.</td></tr>
                                    ) : rows.map((row) => (
                                        <SkillRow key={row.id} row={row} onEdit={setEditing} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {skills?.links?.length > 3 && (
                            <div className="card-footer"><Pagination links={skills.links} /></div>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </AdminLayout>
    );
}

function SkillMobileCard({ row, onEdit }) {
    const statusForm = useForm({});

    return (
        <article className="admin-mobile-card">
            <div className="admin-mobile-card__head">
                <div className="admin-mobile-card__title">{row.name}</div>
                <span className={row.status.class}>{row.status.label}</span>
            </div>
            <p className="small text-muted mb-2">{row.category_name || 'All categories'}</p>
            <div className="admin-mobile-card__actions admin-categories__actions">
                <button type="button" className="btn btn-sm btn-outline--dark admin-categories__btn admin-categories__btn--dark" onClick={() => onEdit(row)}>Edit</button>
                <button type="button" className="btn btn-sm btn-outline--warning admin-categories__btn admin-categories__btn--toggle" disabled={statusForm.processing}
                    onClick={() => statusForm.post(row.statusUrl)}>Toggle</button>
            </div>
        </article>
    );
}

function SkillRow({ row, onEdit }) {
    const statusForm = useForm({});
    return (
        <tr>
            <td>{row.name}</td>
            <td>{row.category_name || <span className="text-muted">All</span>}</td>
            <td><span className={row.status.class}>{row.status.label}</span></td>
            <td>
                <div className="admin-categories__actions">
                    <button type="button" className="btn btn-sm btn-outline--dark admin-categories__btn admin-categories__btn--dark" onClick={() => onEdit(row)}>Edit</button>
                    <button type="button" className="btn btn-sm btn-outline--warning admin-categories__btn admin-categories__btn--toggle" disabled={statusForm.processing}
                        onClick={() => statusForm.post(row.statusUrl)}>Toggle</button>
                </div>
            </td>
        </tr>
    );
}

function SkillForm({ skills, categories, editing, onCancel }) {
    const form = useForm({
        name: editing?.name ?? '',
        category_id: editing?.category_id ? String(editing.category_id) : '',
    });

    useEffect(() => {
        form.setData({
            name: editing?.name ?? '',
            category_id: editing?.category_id ? String(editing.category_id) : '',
        });
    }, [editing]);

    const submit = (e) => {
        e.preventDefault();
        form.post(editing ? editing.storeUrl : skills.createUrl, {
            onSuccess: () => { form.reset(); onCancel?.(); },
        });
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white"><h6 className="mb-0">{editing ? 'Edit Skill' : 'Add Skill'}</h6></div>
            <div className="card-body">
                <form onSubmit={submit}>
                    <div className="form-group mb-3">
                        <label>Name</label>
                        <input className="form-control" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                    </div>
                    <div className="form-group mb-3">
                        <label>Category</label>
                        <select
                            className="form-control form--control"
                            value={form.data.category_id}
                            onChange={(e) => form.setData('category_id', e.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-categories__form-actions">
                        <button type="submit" className="btn btn--primary admin-categories__btn admin-categories__btn--save" disabled={form.processing}>Save</button>
                        {editing && <button type="button" className="btn btn-outline--dark admin-categories__btn admin-categories__btn--dark" onClick={onCancel}>Cancel</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}
