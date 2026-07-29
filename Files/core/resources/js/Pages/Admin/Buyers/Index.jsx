import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'active', label: 'Active Buyers', href: '/admin/buyers/active' },
    { key: 'banned', label: 'Banned Buyers', href: '/admin/buyers/banned' },
    { key: 'email_unverified', label: 'Email Unverified', href: '/admin/buyers/email-unverified' },
    { key: 'mobile_unverified', label: 'Mobile Unverified', href: '/admin/buyers/mobile-unverified' },
    { key: 'kyc_unverified', label: 'KYC Unverified', href: '/admin/buyers/kyc-unverified' },
    { key: 'kyc_pending', label: 'KYC Pending', href: '/admin/buyers/kyc-pending' },
    { key: 'with_balance', label: 'With Balance', href: '/admin/buyers/with-balance' },
    { key: 'all', label: 'All Buyers', href: '/admin/buyers' },
];

export default function Index({ pageTitle, buyers }) {
    const rows = buyers?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} className="mb-3" />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Balance</th>
                                <th>Jobs</th>
                                <th>Joined</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-4">No customers found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link href={row.detailUrl}>{row.fullname}</Link>
                                        <div className="small text-muted">@{row.username}</div>
                                    </td>
                                    <td>{row.email}</td>
                                    <td>{row.balance}</td>
                                    <td>{row.jobsCount}</td>
                                    <td>{row.joinedAt}</td>
                                    <td>
                                        <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Details</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {buyers?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={buyers.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}
