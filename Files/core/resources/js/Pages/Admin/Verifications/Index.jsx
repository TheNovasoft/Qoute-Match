import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending', href: '/admin/provider-verifications?status=pending' },
    { key: 'approved', label: 'Approved', href: '/admin/provider-verifications?status=approved' },
    { key: 'rejected', label: 'Rejected', href: '/admin/provider-verifications?status=rejected' },
];

function QuickApproveButton({ url, label = 'Approve' }) {
    const form = useForm({});

    return (
        <button
            type="button"
            className="btn btn-sm btn--success"
            disabled={form.processing}
            onClick={() => {
                if (window.confirm('Approve this verification badge?')) {
                    form.post(url);
                }
            }}
        >
            {label}
        </button>
    );
}

export default function Index({ pageTitle, verifications }) {
    const rows = verifications?.data ?? [];
    const pendingCount = verifications?.pendingCount ?? 0;

    return (
        <AdminLayout pageTitle={pageTitle}>
            {pendingCount > 0 && verifications.status !== 'pending' && (
                <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <span>
                        <strong>{pendingCount}</strong> badge submission{pendingCount === 1 ? '' : 's'} waiting for review.
                    </span>
                    <Link href="/admin/provider-verifications?status=pending" className="btn btn-sm btn--primary">
                        Review pending
                    </Link>
                </div>
            )}

            <AdminStatusTabs
                className="mb-3"
                active={verifications.status}
                tabs={STATUS_TABS.map((tab) => ({
                    ...tab,
                    badge: tab.key === 'pending' && pendingCount > 0 ? pendingCount : null,
                }))}
            />

            <div className="card shadow-sm">
                <div className="card-header bg-white">
                    <h6 className="mb-0">Verification Badges</h6>
                    <p className="small text-muted mb-0 mt-1">
                        Review insurance, company, and trade licence documents submitted by providers.
                    </p>
                </div>
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Provider</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-4">No verifications found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.typeLabel}</td>
                                    <td>
                                        <div>{row.providerFullname}</div>
                                        <small className="text-muted">@{row.providerUsername}</small>
                                    </td>
                                    <td>{row.submittedAt}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td>
                                        <div className="d-flex flex-wrap gap-1">
                                            <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">
                                                {row.isPending ? 'Review' : 'Details'}
                                            </Link>
                                            {row.approveUrl && (
                                                <QuickApproveButton url={row.approveUrl} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {verifications?.links?.length > 3 && (
                    <div className="card-footer">
                        <Pagination links={verifications.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
