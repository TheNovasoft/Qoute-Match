import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending', href: '/admin/reviews/pending' },
    { key: 'approved', label: 'Approved', href: '/admin/reviews/approved' },
    { key: 'hidden', label: 'Hidden', href: '/admin/reviews/hidden' },
    { key: 'verified', label: 'Verified', href: '/admin/reviews/verified' },
    { key: 'disputed', label: 'Disputed', href: '/admin/reviews/disputed' },
];

export default function Index({ pageTitle, reviews }) {
    const rows = reviews?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="btn-group flex-wrap mb-3">
                {STATUS_TABS.map((tab) => (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className={`btn btn-sm ${reviews.status === tab.key ? 'btn--primary' : 'btn-outline--primary'} mb-1`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Rating</th>
                                <th>Provider</th>
                                <th>Customer</th>
                                <th>Request</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Flags</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-muted py-4">No reviews found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.rating}/5</td>
                                    <td>{row.providerUsername}</td>
                                    <td>{row.buyerUsername}</td>
                                    <td>{row.jobTitle}</td>
                                    <td>{row.createdAt}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td className="small">
                                        {row.isVerified && <span className="badge badge--success me-1">Verified</span>}
                                        {row.investigation?.status > 0 && (
                                            <span className="badge badge--warning">{row.investigation.label}</span>
                                        )}
                                        {!row.isVerified && !(row.investigation?.status > 0) && '—'}
                                    </td>
                                    <td>
                                        <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Details</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {reviews?.links?.length > 3 && (
                    <div className="card-footer">
                        <Pagination links={reviews.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
