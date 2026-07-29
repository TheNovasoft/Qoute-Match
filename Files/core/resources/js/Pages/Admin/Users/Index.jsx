import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminFilterBar from '@/Components/Admin/AdminFilterBar';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const USER_TABS = [
    { key: 'active', label: 'Active', href: '/admin/freelancers/active' },
    { key: 'incomplete', label: 'Incomplete Profile', href: '/admin/freelancers/incomplete-profile' },
    { key: 'pending_approval', label: 'Pending Approval', href: '/admin/freelancers/pending-approval' },
    { key: 'banned', label: 'Banned', href: '/admin/freelancers/banned' },
    { key: 'email_unverified', label: 'Email Unverified', href: '/admin/freelancers/email-unverified' },
    { key: 'mobile_unverified', label: 'Mobile Unverified', href: '/admin/freelancers/mobile-unverified' },
    { key: 'kyc_unverified', label: 'KYC Unverified', href: '/admin/freelancers/kyc-unverified' },
    { key: 'all', label: 'All', href: '/admin/freelancers' },
];

const FILTER_URLS = {
    active: '/admin/freelancers/active',
    incomplete: '/admin/freelancers/incomplete-profile',
    pending_approval: '/admin/freelancers/pending-approval',
    banned: '/admin/freelancers/banned',
    email_unverified: '/admin/freelancers/email-unverified',
    mobile_unverified: '/admin/freelancers/mobile-unverified',
    kyc_unverified: '/admin/freelancers/kyc-unverified',
    kyc_pending: '/admin/freelancers/kyc-pending',
    with_balance: '/admin/freelancers/with-balance',
    all: '/admin/freelancers',
};

export default function Index({ pageTitle, users }) {
    const rows = users?.data ?? [];
    const scope = users?.scope || 'all';
    const filterUrl = FILTER_URLS[scope] || '/admin/freelancers';

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={USER_TABS} active={scope} />

            <AdminFilterBar
                actionUrl={filterUrl}
                searchPlaceholder="Search provider…"
            />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th>Email</th>
                                <th>Balance</th>
                                <th>Approved</th>
                                <th>Profile</th>
                                <th>Joined</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-muted py-4">No providers found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link href={row.detailUrl}>{row.fullname}</Link>
                                        <div className="small text-muted">@{row.username}</div>
                                    </td>
                                    <td>{row.email}</td>
                                    <td>{row.balance}</td>
                                    <td>
                                        <span className={row.providerApproved ? 'badge badge--success' : 'badge badge--warning'}>
                                            {row.providerApproved ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={row.profileComplete ? 'badge badge--success' : 'badge badge--dark'}>
                                            {row.profileComplete ? 'Complete' : 'Incomplete'}
                                        </span>
                                    </td>
                                    <td>{row.joinedAt}</td>
                                    <td>
                                        <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Details</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={users.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}
