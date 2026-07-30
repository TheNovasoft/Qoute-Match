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

export default function Packages({ pageTitle, packages }) {
    const rows = packages?.data ?? [];
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={MONETISATION_TABS} className="mb-3" />
            <div className="row gy-4">
                <div className="col-lg-4">
                    <PackageForm packages={packages} editing={editing} onCancel={() => setEditing(null)} />
                </div>
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="table-responsive">
                            <table className="table table--light mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Credits</th>
                                        <th>Bonus</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <PackageRow key={row.id} row={row} onEdit={setEditing} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {packages?.links?.length > 3 && (
                            <div className="card-footer"><Pagination links={packages.links} /></div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function PackageRow({ row, onEdit }) {
    const statusForm = useForm({});
    const deleteForm = useForm({});

    return (
        <tr>
            <td>{row.name}</td>
            <td>{row.credits}</td>
            <td>{row.bonusCredits}</td>
            <td>{row.price}</td>
            <td><span className={row.status.class}>{row.status.label}</span></td>
            <td className="d-flex gap-1 flex-wrap">
                <button type="button" className="btn btn-sm btn-outline--dark" onClick={() => onEdit(row)}>Edit</button>
                <button type="button" className="btn btn-sm btn-outline--warning" disabled={statusForm.processing}
                    onClick={() => statusForm.post(row.statusUrl)}>Toggle</button>
                <button type="button" className="btn btn-sm btn-outline--danger" disabled={deleteForm.processing}
                    onClick={() => { if (window.confirm('Delete package?')) deleteForm.post(row.deleteUrl); }}>Delete</button>
            </td>
        </tr>
    );
}

function PackageForm({ packages, editing, onCancel }) {
    const form = useForm({
        name: editing?.name ?? '',
        credits: editing?.credits ?? '',
        bonus_credits: editing?.bonusCredits ?? 0,
        price: '',
        sort_order: editing?.sortOrder ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        const url = editing ? editing.updateUrl : packages.createUrl;
        form.post(url, { onSuccess: () => { form.reset(); onCancel?.(); } });
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white"><h6 className="mb-0">{editing ? 'Edit Package' : 'Add Package'}</h6></div>
            <div className="card-body">
                <form onSubmit={submit}>
                    {['name', 'credits', 'bonus_credits', 'price', 'sort_order'].map((field) => (
                        <div key={field} className="form-group mb-3">
                            <label>{field.replace(/_/g, ' ')}</label>
                            <input className="form-control" value={form.data[field]}
                                onChange={(e) => form.setData(field, e.target.value)} required={field !== 'bonus_credits' && field !== 'sort_order'} />
                        </div>
                    ))}
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn--primary" disabled={form.processing}>Save</button>
                        {editing && <button type="button" className="btn btn-outline--dark" onClick={onCancel}>Cancel</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}
