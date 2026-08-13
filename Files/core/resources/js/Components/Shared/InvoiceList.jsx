import { Link, router } from '@inertiajs/react';
import Pagination from '@/Components/Shared/Pagination';

const TYPE_BADGE = {
    job_published: 'badge badge--primary',
    project_accepted: 'badge badge--warning',
    project_completed: 'badge badge--success',
    project_partial: 'badge badge--info',
};

export default function InvoiceList({ invoices, showParties = false, canManage = false, variant = 'default' }) {
    const rows = invoices?.data ?? [];
    const isAdmin = variant === 'admin';

    const deleteInvoice = (row) => {
        if (!row.deleteUrl) return;
        if (!window.confirm(`Delete invoice ${row.invoiceNumber}? This cannot be undone.`)) return;
        router.post(row.deleteUrl);
    };

    const colSpan = showParties ? 9 : 7;

    return (
        <div className={isAdmin ? 'table-responsive' : 'table-wrapper'}>
            <table className={isAdmin ? 'table table--light mb-0' : 'table table--responsive--md'}>
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Type</th>
                        <th>Project</th>
                        {showParties ? <th>Customer</th> : null}
                        {showParties ? <th>Provider</th> : null}
                        <th>Amount</th>
                        <th>Provider Payout</th>
                        <th>Date</th>
                        <th className="text-end">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={colSpan} className="text-center text-muted py-4">No invoices found.</td></tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                <td data-label="Invoice #">
                                    <strong className="d-block">{row.invoiceNumber}</strong>
                                </td>
                                <td data-label="Type">
                                    <span className={TYPE_BADGE[row.type] || 'badge badge--dark'}>
                                        {row.typeLabel}
                                    </span>
                                </td>
                                <td data-label="Project">{row.jobTitle || '—'}</td>
                                {showParties ? <td data-label="Customer">{row.buyerName || '—'}</td> : null}
                                {showParties ? <td data-label="Provider">{row.providerName && row.providerName !== '—' ? row.providerName : '—'}</td> : null}
                                <td data-label="Amount">{row.amount}</td>
                                <td data-label="Provider Payout">{row.providerPayout || row.netAmount || '—'}</td>
                                <td data-label="Date" className="text-nowrap">{row.createdAt}</td>
                                <td data-label="Action" className="text-end text-nowrap">
                                    <div className="d-inline-flex align-items-center gap-2">
                                        <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">
                                            View
                                        </Link>
                                        {canManage && row.deleteUrl ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline--danger"
                                                onClick={() => deleteInvoice(row)}
                                            >
                                                Delete
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {invoices?.links?.length > 3 ? (
                isAdmin ? (
                    <div className="card-footer"><Pagination links={invoices.links} /></div>
                ) : (
                    <Pagination links={invoices.links} />
                )
            ) : null}
        </div>
    );
}
