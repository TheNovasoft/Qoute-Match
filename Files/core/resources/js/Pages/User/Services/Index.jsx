import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import MasterLayout from '@/Components/Layout/MasterLayout';

function ServiceForm({ initial, storeUrl, updateUrl, onCancel }) {
    const isEdit = Boolean(initial?.id);
    const { data, setData, post, processing, errors, reset } = useForm({
        title: initial?.title || '',
        description: initial?.description || '',
        price: initial?.priceRaw ?? '',
        delivery_days: initial?.deliveryDays ?? 7,
        sort_order: initial?.sortOrder ?? 0,
    });

    const submit = (event) => {
        event.preventDefault();
        const url = isEdit ? `${updateUrl}/${initial.id}` : storeUrl;
        post(url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onCancel?.();
            },
        });
    };

    return (
        <form className="card custom--card mb-4" onSubmit={submit}>
            <div className="card-body">
                <h5 className="mb-3">{isEdit ? 'Edit service package' : 'Add service package'}</h5>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form--label">Title</label>
                        <input className="form-control form--control" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                        {errors.title && <small className="text-danger">{errors.title}</small>}
                    </div>
                    <div className="col-md-3">
                        <label className="form--label">Price</label>
                        <input type="number" min="0" step="0.01" className="form-control form--control" value={data.price} onChange={(e) => setData('price', e.target.value)} required />
                        {errors.price && <small className="text-danger">{errors.price}</small>}
                    </div>
                    <div className="col-md-3">
                        <label className="form--label">Delivery (days)</label>
                        <input type="number" min="1" max="365" className="form-control form--control" value={data.delivery_days} onChange={(e) => setData('delivery_days', e.target.value)} required />
                    </div>
                    <div className="col-12">
                        <label className="form--label">Description</label>
                        <textarea className="form-control form--control" rows={4} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn--base btn-sm" disabled={processing}>
                        {isEdit ? 'Save changes' : 'Add package'}
                    </button>
                    {onCancel && (
                        <button type="button" className="btn btn-outline--base btn-sm" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default function ServicesIndex({ pageTitle, services, storeUrl, updateUrl, statusUrl }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const toggleStatus = (id) => {
        router.post(`${statusUrl}/${id}/status`, {}, { preserveScroll: true });
    };

    const removeService = (id) => {
        if (!window.confirm('Remove this service package?')) return;
        router.post(`${statusUrl}/${id}/delete`, {}, { preserveScroll: true });
    };

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">My Service Packages</h4>
                    <p className="text-muted mb-0">Fixed-price listings shown on your public profile.</p>
                </div>
                {!showForm && !editing && (
                    <button type="button" className="btn btn--base btn-sm" onClick={() => setShowForm(true)}>
                        Add package
                    </button>
                )}
            </div>

            {(showForm || editing) && (
                <ServiceForm
                    initial={editing}
                    storeUrl={storeUrl}
                    updateUrl={updateUrl}
                    onCancel={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                />
            )}

            <div className="row gy-3">
                {services.length === 0 ? (
                    <div className="col-12">
                        <div className="card custom--card">
                            <div className="card-body text-center py-5 text-muted">
                                No service packages yet. Add your first fixed-price offer.
                            </div>
                        </div>
                    </div>
                ) : (
                    services.map((service) => (
                        <div className="col-md-6" key={service.id}>
                            <div className="card custom--card h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between gap-2 mb-2">
                                        <h5 className="mb-0">{service.title}</h5>
                                        <span className={`badge ${service.status ? 'bg-success' : 'bg-secondary'}`}>
                                            {service.status ? 'Live' : 'Hidden'}
                                        </span>
                                    </div>
                                    <p className="text--base fw-semibold mb-2">{service.price}</p>
                                    <p className="small text-muted mb-2">Delivery: {service.deliveryDays} days</p>
                                    {service.description && <p className="small mb-3">{service.description}</p>}
                                    <div className="d-flex flex-wrap gap-2">
                                        <button type="button" className="btn btn-outline--base btn-sm" onClick={() => { setEditing(service); setShowForm(false); }}>
                                            Edit
                                        </button>
                                        <button type="button" className="btn btn-outline--secondary btn-sm" onClick={() => toggleStatus(service.id)}>
                                            {service.status ? 'Hide' : 'Publish'}
                                        </button>
                                        <button type="button" className="btn btn-outline--danger btn-sm" onClick={() => removeService(service.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </MasterLayout>
    );
}
