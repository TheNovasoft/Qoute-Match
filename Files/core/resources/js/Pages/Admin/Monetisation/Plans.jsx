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

const emptyPlan = () => ({
    name: '',
    slug: '',
    price: '',
    duration_days: '30',
    monthly_credits: 0,
    unlimited_quotes: '0',
    description: '',
    sort_order: 0,
});

function planToForm(editing) {
    if (!editing) {
        return emptyPlan();
    }

    return {
        name: editing.name ?? '',
        slug: editing.slug ?? '',
        price: editing.priceAmount != null ? String(editing.priceAmount) : '',
        duration_days: editing.durationDays != null ? String(editing.durationDays) : '30',
        monthly_credits: editing.monthlyCredits ?? 0,
        unlimited_quotes: editing.unlimitedQuotes ? '1' : '0',
        description: editing.description ?? '',
        sort_order: editing.sortOrder ?? 0,
    };
}

export default function Plans({ pageTitle, plans }) {
    const rows = plans?.data ?? [];
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={MONETISATION_TABS} className="mb-3" />
            <div className="row gy-4">
                <div className="col-lg-4">
                    <PlanForm
                        key={editing?.id ?? 'create'}
                        plans={plans}
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

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
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

function PlanForm({ plans, editing, onCancel }) {
    const form = useForm(planToForm(editing));
    const [priceFocused, setPriceFocused] = useState(false);
    const [slugManual, setSlugManual] = useState(Boolean(editing?.slug));

    useEffect(() => {
        form.setData(planToForm(editing));
        form.clearErrors();
        setSlugManual(Boolean(editing?.slug));
        setPriceFocused(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?.id]);

    const submit = (e) => {
        e.preventDefault();
        const url = editing ? editing.updateUrl : plans.createUrl;
        const numericPrice = parsePriceInput(form.data.price);
        const cleanSlug = slugify(form.data.slug || form.data.name);

        form.setData({
            ...form.data,
            price: numericPrice === '' ? '' : Number(numericPrice).toFixed(2),
            slug: cleanSlug,
        });

        form.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData(emptyPlan());
                setSlugManual(false);
                onCancel?.();
            },
        });
    };

    const onNameChange = (value) => {
        if (!slugManual) {
            form.setData({
                ...form.data,
                name: value,
                slug: slugify(value),
            });
            return;
        }
        form.setData('name', value);
    };

    const onSlugChange = (value) => {
        setSlugManual(true);
        form.setData('slug', slugify(value));
    };

    const onPriceChange = (value) => {
        form.setData('price', parsePriceInput(value));
    };

    const priceValue = priceFocused
        ? (form.data.price ?? '')
        : formatPriceDisplay(form.data.price);

    const slugHint = form.errors.slug
        ? form.errors.slug
        : 'Auto-generated from name (spaces become dashes)';

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white"><h6 className="mb-0">{editing ? 'Edit Plan' : 'Add Plan'}</h6></div>
            <div className="card-body">
                <form onSubmit={submit}>
                    <div className="form-group mb-3">
                        <label>Name</label>
                        <input className="form-control" value={form.data.name} onChange={(e) => onNameChange(e.target.value)} required />
                        {form.errors.name && <small className="text-danger d-block mt-1">{form.errors.name}</small>}
                    </div>
                    <div className="form-group mb-3">
                        <label>Slug</label>
                        <input className="form-control" value={form.data.slug} onChange={(e) => onSlugChange(e.target.value)} required />
                        <small className={`d-block mt-1 ${form.errors.slug ? 'text-danger' : 'text-muted'}`}>{slugHint}</small>
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
                            onChange={(e) => onPriceChange(e.target.value)}
                            placeholder="$0.00"
                            required
                        />
                        {form.errors.price && <small className="text-danger d-block mt-1">{form.errors.price}</small>}
                    </div>
                    <div className="form-group mb-3">
                        <label>Duration (days)</label>
                        <input type="number" className="form-control" value={form.data.duration_days} onChange={(e) => form.setData('duration_days', e.target.value)} required />
                        {form.errors.duration_days && <small className="text-danger d-block mt-1">{form.errors.duration_days}</small>}
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
                            {form.errors.monthly_credits && <small className="text-danger d-block mt-1">{form.errors.monthly_credits}</small>}
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
