import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending', href: '/admin/deposit/pending' },
    { key: 'approved', label: 'Approved', href: '/admin/deposit/approved' },
    { key: 'successful', label: 'Successful', href: '/admin/deposit/successful' },
    { key: 'rejected', label: 'Rejected', href: '/admin/deposit/rejected' },
    { key: 'initiated', label: 'Initiated', href: '/admin/deposit/initiated' },
    { key: 'all', label: 'All Deposits', href: '/admin/deposit/all' },
];

export default function Index({ pageTitle, deposits }) {
    const rows = deposits?.data ?? [];
    const summary = deposits?.summary;

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} className="mb-3" />

            {summary && (
                <div className="row gy-3 mb-4">
                    {[
                        ['Successful', summary.successful, 'success'],
                        ['Pending', summary.pending, 'warning'],
                        ['Rejected', summary.rejected, 'danger'],
                        ['Initiated', summary.initiated, 'primary'],
                    ].map(([label, value, tone]) => (
                        <div key={label} className="col-md-3">
                            <div className={`card shadow-sm border-start border-4 border-${tone}`}>
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
                                <th>Gateway</th>
                                <th>Amount</th>
                                <th>Charge</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-muted py-4">No deposits found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.trx}</td>
                                    <td>{row.owner}</td>
                                    <td>{row.gateway}</td>
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
                {deposits?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={deposits.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}
