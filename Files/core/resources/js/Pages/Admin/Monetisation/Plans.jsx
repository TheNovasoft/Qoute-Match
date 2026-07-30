import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const MONETISATION_TABS = [
    { key: 'settings', label: 'Settings', href: '/admin/monetisation/settings' },
    { key: 'packages', label: 'Credit Packages', href: '/admin/monetisation/packages' },
    { key: 'plans', label: 'Subscription Plans', href: '/admin/monetisation/plans' },
];

export default function Plans({ pageTitle, plans }) {
    const rows = plans?.data ?? [];
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={MONETISATION_TABS} className="mb-3" />
            <div className="row gy-4">
                <div className="col-lg-4">
                    <PlanForm plans={plans} editing={editing} onCancel={() => setEditing(null)} />
                </div>
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="table-responsive">
                            <table className="table table--light mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Slug</th>
                                        <th>Price</th>
                                        <th>Duration</th>
                                        <th>Credits/mo</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <PlanRow key={row.id} row={row} onEdit={setEditing} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {plans?.links?.length > 3 && (
                            <div className="card-footer"><Pagination links={plans.links} /></div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function PlanRow({ row, onEdit }) {
    const statusForm = useForm({});
    const deleteForm = useForm({});

    return (
        <tr>
            <td>{row.name}</td>
            <td><code>{row.slug}</code></td>
            <td>{row.price}</td>
            <td>{row.durationDays}d</td>
            <td>{row.unlimitedQuotes ? '∞' : row.monthlyCredits}</td>
            <td><span className={row.status.class}>{row.status.label}</span></td>
            <td className="d-flex gap-1 flex-wrap">
                <button type="button" className="btn btn-sm btn-outline--dark" onClick={() => onEdit(row)}>Edit</button>
                <button type="button" className="btn btn-sm btn-outline--warning" disabled={statusForm.processing}
                    onClick={() => statusForm.post(row.statusUrl)}>Toggle</button>
                <button type="button" className="btn btn-sm btn-outline--danger" disabled={deleteForm.processing}
                    onClick={() => { if (window.confirm('Delete plan?')) deleteForm.post(row.deleteUrl); }}>Delete</button>
            </td>
        </tr>
    );
}

function PlanForm({ plans, editing, onCancel }) {
    const form = useForm({
        name: editing?.name ?? '',
        slug: editing?.slug ?? '',
        price: '',
        duration_days: editing?.durationDays ?? '',
        monthly_credits: editing?.monthlyCredits ?? 0,
        unlimited_quotes: editing?.unlimitedQuotes ? '1' : '0',
        description: '',
        sort_order: 0,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(editing ? editing.updateUrl : plans.createUrl, { onSuccess: () => { form.reset(); onCancel?.(); } });
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white"><h6 className="mb-0">{editing ? 'Edit Plan' : 'Add Plan'}</h6></div>
            <div className="card-body">
                <form onSubmit={submit}>
                    <div className="form-group mb-3">
                        <label>Name</label>
                        <input className="form-control" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                    </div>
                    <div className="form-group mb-3">
                        <label>Slug</label>
                        <input className="form-control" value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} required />
                    </div>
                    <div className="form-group mb-3">
                        <label>Price</label>
                        <input type="number" step="0.01" className="form-control" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} required />
                    </div>
                    <div className="form-group mb-3">
                        <label>Duration (days)</label>
                        <input type="number" className="form-control" value={form.data.duration_days} onChange={(e) => form.setData('duration_days', e.target.value)} required />
                    </div>
                    <div className="form-group mb-3">
                        <div className="form-check">
                            <input type="checkbox" className="form-check-input" checked={form.data.unlimited_quotes === '1'}
                                onChange={(e) => form.setData('unlimited_quotes', e.target.checked ? '1' : '0')} />
                            <label className="form-check-label">Unlimited quotes</label>
                        </div>
                    </div>
                    {form.data.unlimited_quotes !== '1' && (
                        <div className="form-group mb-3">
                            <label>Monthly credits</label>
                            <input type="number" className="form-control" value={form.data.monthly_credits}
                                onChange={(e) => form.setData('monthly_credits', e.target.value)} />
                        </div>
                    )}
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn--primary" disabled={form.processing}>Save</button>
                        {editing && <button type="button" className="btn btn-outline--dark" onClick={onCancel}>Cancel</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}
