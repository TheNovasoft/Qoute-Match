import { Link } from '@inertiajs/react';
import Pagination from '@/Components/Shared/Pagination';

export default function InvoiceList({ invoices, showParties = false }) {
    const rows = invoices?.data ?? [];

    return (
        <div className="table-wrapper">
            <table className="table table--responsive--md">
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
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={showParties ? 9 : 7} className="text-center text-muted py-4">No invoices found.</td></tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                <td data-label="Invoice #"><strong>{row.invoiceNumber}</strong></td>
                                <td data-label="Type">{row.typeLabel}</td>
                                <td data-label="Project">{row.jobTitle}</td>
                                {showParties ? <td data-label="Customer">{row.buyerName}</td> : null}
                                {showParties ? <td data-label="Provider">{row.providerName}</td> : null}
                                <td data-label="Amount">{row.amount}</td>
                                <td data-label="Provider Payout">{row.providerPayout || row.netAmount}</td>
                                <td data-label="Date">{row.createdAt}</td>
                                <td data-label="Action">
                                    <Link href={row.detailUrl} className="btn btn--base btn-sm">View</Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {invoices?.links?.length > 3 && <Pagination links={invoices.links} />}
        </div>
    );
}
