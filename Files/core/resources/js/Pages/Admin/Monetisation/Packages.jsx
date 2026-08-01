import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const MONETISATION_TABS = [
    { key: 'settings', label: 'Settings', href: '/admin/monetisation/settings' },
    { key: 'packages', label: 'Credit Packages', href: '/admin/monetisation/packages' },
    { key: 'plans', label: 'Subscription Plans', href: '/admin/monetisation/plans' },
];

const emptyPackage = () => ({
    name: '',
    credits: '',
    bonus_credits: 0,
    price: '',
    sort_order: 0,
});

function packageToForm(editing) {
    if (!editing) {
        return emptyPackage();
    }

    return {
        name: editing.name ?? '',
        credits: editing.credits != null ? String(editing.credits) : '',
        bonus_credits: editing.bonusCredits ?? 0,
        price: editing.priceAmount != null ? String(editing.priceAmount) : '',
        sort_order: editing.sortOrder ?? 0,
    };
}

function parsePriceInput(value) {
    const cleaned = String(value || '').replace(/[^0-9.]/g, '');
    if (cleaned === '' || cleaned === '.') {
        return '';
    }
    const parts = cleaned.split('.');
    const whole = parts[0] || '0';
    const decimals = parts.slice(1).join('').slice(0, 2);
    return parts.length > 1 ? `${whole}.${decimals}` : whole;
}

function formatPriceDisplay(value) {
    const numeric = parsePriceInput(value);
    if (numeric === '') {
        return '';
    }
    const amount = Number(numeric);
    if (Number.isNaN(amount)) {
        return '';
    }
    return `$${amount.toFixed(2)}`;
}

export default function Packages({ pageTitle, packages }) {
    const rows = packages?.data ?? [];
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={MONETISATION_TABS} className="mb-3" />
            <div className="row gy-4">
                <div className="col-lg-4">
                    <PackageForm
                        key={editing?.id ?? 'create'}
                        packages={packages}
                        editing={editing}
                        onCancel={() => setEditing(null)}
                    />
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
    const form = useForm(packageToForm(editing));
    const [priceFocused, setPriceFocused] = useState(false);

    useEffect(() => {
        form.setData(packageToForm(editing));
        form.clearErrors();
        setPriceFocused(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?.id]);

    const submit = (e) => {
        e.preventDefault();
        const url = editing ? editing.updateUrl : packages.createUrl;
        const numericPrice = parsePriceInput(form.data.price);

        form.setData({
            ...form.data,
            price: numericPrice === '' ? '' : Number(numericPrice).toFixed(2),
        });

        form.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData(emptyPackage());
                onCancel?.();
            },
        });
    };

    const priceValue = priceFocused
        ? (form.data.price ?? '')
        : formatPriceDisplay(form.data.price);

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white"><h6 className="mb-0">{editing ? 'Edit Package' : 'Add Package'}</h6></div>
            <div className="card-body">
                <form onSubmit={submit}>
                    <div className="form-group mb-3">
                        <label>Name</label>
                        <input className="form-control" value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)} required />
                        {form.errors.name && <small className="text-danger d-block mt-1">{form.errors.name}</small>}
                    </div>
                    <div className="form-group mb-3">
                        <label>Credits</label>
                        <input type="number" className="form-control" value={form.data.credits}
                            onChange={(e) => form.setData('credits', e.target.value)} required />
                        {form.errors.credits && <small className="text-danger d-block mt-1">{form.errors.credits}</small>}
                    </div>
                    <div className="form-group mb-3">
                        <label>Bonus credits</label>
                        <input type="number" className="form-control" value={form.data.bonus_credits}
                            onChange={(e) => form.setData('bonus_credits', e.target.value)} />
                        {form.errors.bonus_credits && <small className="text-danger d-block mt-1">{form.errors.bonus_credits}</small>}
                    </div>
                    <div className="form-group mb-3">
                        <label>Price</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            className="form-control"
                            value={priceValue}
                            onFocus={() => setPriceFocused(true)}
                            onBlur={() => {
                                setPriceFocused(false);
                                if (form.data.price !== '') {
                                    form.setData('price', Number(parsePriceInput(form.data.price)).toFixed(2));
                                }
                            }}
                            onChange={(e) => form.setData('price', parsePriceInput(e.target.value))}
                            placeholder="$0.00"
                            required
                        />
                        {form.errors.price && <small className="text-danger d-block mt-1">{form.errors.price}</small>}
                    </div>
                    <div className="form-group mb-3">
                        <label>Sort order</label>
                        <input type="number" className="form-control" value={form.data.sort_order}
                            onChange={(e) => form.setData('sort_order', e.target.value)} />
                        {form.errors.sort_order && <small className="text-danger d-block mt-1">{form.errors.sort_order}</small>}
                    </div>
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn--primary" disabled={form.processing}>Save</button>
                        {editing && <button type="button" className="btn btn-outline--dark" onClick={onCancel}>Cancel</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}
