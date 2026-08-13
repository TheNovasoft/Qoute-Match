import { router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import InvoiceList from '@/Components/Shared/InvoiceList';

export default function Index({ pageTitle, invoices, filters, typeOptions }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [type, setType] = useState(filters?.type || '');

    const applyFilters = (event) => {
        event.preventDefault();
        router.get('/admin/invoices', {
            search: search || undefined,
            type: type || undefined,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilters = () => {
        setSearch('');
        setType('');
        router.get('/admin/invoices', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AdminLayout pageTitle={pageTitle}>
            <form className="admin-filter-bar card shadow-sm mb-3" onSubmit={applyFilters}>
                <div className="card-body py-3">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-4 col-lg-4">
                            <label className="form-label small text-muted mb-1">Search</label>
                            <input
                                type="search"
                                className="form-control form--control"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Invoice #, project, customer, trx"
                            />
                        </div>
                        <div className="col-6 col-md-3 col-lg-3">
                            <label className="form-label small text-muted mb-1">Type</label>
                            <select
                                className="form-control form--control"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                {(typeOptions || []).map((opt) => (
                                    <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-md-auto d-flex gap-2">
                            <button type="submit" className="btn btn--primary btn-sm">Filter</button>
                            <button type="button" className="btn btn-outline--dark btn-sm" onClick={resetFilters}>Reset</button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="card shadow-sm">
                <InvoiceList invoices={invoices} showParties canManage variant="admin" />
            </div>
        </AdminLayout>
    );
}
