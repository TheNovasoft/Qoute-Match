import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import InvoiceList from '@/Components/Shared/InvoiceList';

export default function Index({ pageTitle, invoices, filters, typeOptions }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [type, setType] = useState(filters?.type || '');

    const applyFilters = (event) => {
        event.preventDefault();
        router.get('/admin/invoices', { search, type }, { preserveState: true });
    };

    return (
        <AdminLayout pageTitle={pageTitle}>
            <form onSubmit={applyFilters} className="card shadow-sm mb-3">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label">Search</label>
                            <input
                                className="form-control"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Invoice #, project, trx"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                                {(typeOptions || []).map((opt) => (
                                    <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <button type="submit" className="btn btn--primary w-100">Filter</button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="card shadow-sm">
                <div className="card-body">
                    <InvoiceList invoices={invoices} showParties />
                </div>
            </div>
        </AdminLayout>
    );
}
