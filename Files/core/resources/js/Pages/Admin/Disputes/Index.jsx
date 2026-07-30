import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'active', label: 'Active', href: '/admin/disputes?status=active' },
    { key: 'open', label: 'Open', href: '/admin/disputes?status=open' },
    { key: 'in_review', label: 'In Review', href: '/admin/disputes?status=in_review' },
    { key: 'resolved', label: 'Resolved', href: '/admin/disputes?status=resolved' },
    { key: 'rejected', label: 'Rejected', href: '/admin/disputes?status=rejected' },
];

export default function Index({ pageTitle, disputes }) {
    const rows = disputes?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} active={disputes.status} className="mb-3" />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Request</th>
                                <th>Customer</th>
                                <th>Provider</th>
                                <th>Type</th>
                                <th>Raised By</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={9} className="text-center text-muted py-4">No disputes found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.subject}</td>
                                    <td>{row.jobTitle}</td>
                                    <td>{row.buyerUsername}</td>
                                    <td>{row.providerUsername}</td>
                                    <td>{row.typeLabel}</td>
                                    <td>{row.raisedBy}</td>
                                    <td>{row.createdAt}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td>
                                        <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">
                                            Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {disputes?.links?.length > 3 && (
                    <div className="card-footer">
                        <Pagination links={disputes.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
