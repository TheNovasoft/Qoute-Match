import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending', href: '/admin/withdraw/pending' },
    { key: 'approved', label: 'Approved', href: '/admin/withdraw/approved' },
    { key: 'rejected', label: 'Rejected', href: '/admin/withdraw/rejected' },
    { key: 'all', label: 'All Withdrawals', href: '/admin/withdraw/all' },
];

export default function Index({ pageTitle, withdrawals }) {
    const rows = withdrawals?.data ?? [];
    const summary = withdrawals?.summary;

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} className="mb-3" />

            {summary && (
                <div className="row gy-3 mb-4">
                    {[
                        ['Successful', summary.successful],
                        ['Pending', summary.pending],
                        ['Rejected', summary.rejected],
                    ].map(([label, value]) => (
                        <div key={label} className="col-md-4">
                            <div className="card shadow-sm">
                                <div className="card-body py-3">
                                    <div className="text-muted small">{label}</div>
                                    <strong>{value}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>TRX</th>
                                <th>User</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Charge</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-muted py-4">No withdrawals found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.trx}</td>
                                    <td>{row.owner}</td>
                                    <td>{row.method}</td>
                                    <td>{row.amount}</td>
                                    <td>{row.charge}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td>{row.createdAt}</td>
                                    <td><Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Details</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {withdrawals?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={withdrawals.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}
