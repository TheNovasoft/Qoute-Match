import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';
import { FREELANCER_TABS, FreelancerSearch } from '@/Pages/Admin/Users/Index';

export default function PendingApproval({ pageTitle, providers }) {
    const rows = providers?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={FREELANCER_TABS} className="mb-3" />
            <FreelancerSearch />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th>Email</th>
                                <th>Country</th>
                                <th>Profile</th>
                                <th>Joined</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-4">No pending providers.</td></tr>
                            ) : rows.map((row) => (
                                <PendingRow key={row.id} row={row} />
                            ))}
                        </tbody>
                    </table>
                </div>
                {providers?.links?.length > 3 && (
                    <div className="card-footer">
                        <Pagination links={providers.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function PendingRow({ row }) {
    const approveForm = useForm({});

    return (
        <tr>
            <td>
                <Link href={row.detailUrl}>{row.fullname}</Link>
                <div className="small text-muted">@{row.username}</div>
            </td>
            <td>{row.email}</td>
            <td>{row.country ?? '—'}</td>
            <td>
                <span className={row.profileComplete ? 'badge badge--success' : 'badge badge--warning'}>
                    {row.profileComplete ? 'Complete' : 'Incomplete'}
                </span>
            </td>
            <td>{row.joinedAt}</td>
            <td className="d-flex gap-1 flex-wrap">
                <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Profile</Link>
                <button
                    type="button"
                    className="btn btn-sm btn--success"
                    disabled={approveForm.processing}
                    onClick={() => {
                        if (window.confirm(`Approve ${row.fullname} as a service provider?`)) {
                            approveForm.post(row.approveUrl);
                        }
                    }}
                >
                    Approve
                </button>
            </td>
        </tr>
    );
}
