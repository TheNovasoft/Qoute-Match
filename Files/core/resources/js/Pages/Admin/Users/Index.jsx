import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

export const FREELANCER_TABS = [
    { key: 'active', label: 'Active Freelancers', href: '/admin/freelancers/active' },
    { key: 'incomplete', label: 'Incomplete Profile', href: '/admin/freelancers/incomplete-profile' },
    { key: 'pending_approval', label: 'Pending Approval', href: '/admin/freelancers/pending-approval' },
    { key: 'banned', label: 'Banned', href: '/admin/freelancers/banned' },
    { key: 'email_unverified', label: 'Email Unverified', href: '/admin/freelancers/email-unverified' },
    { key: 'mobile_unverified', label: 'Mobile Unverified', href: '/admin/freelancers/mobile-unverified' },
    { key: 'kyc_unverified', label: 'KYC Unverified', href: '/admin/freelancers/kyc-unverified' },
    { key: 'kyc_pending', label: 'KYC Pending', href: '/admin/freelancers/kyc-pending' },
    { key: 'with_balance', label: 'With Balance', href: '/admin/freelancers/with-balance' },
    { key: 'all', label: 'All Freelancers', href: '/admin/freelancers' },
];

export function FreelancerSearch() {
    const pageUrl = usePage().url || '';
    const path = pageUrl.split('?')[0];
    const params = new URLSearchParams(pageUrl.includes('?') ? pageUrl.split('?')[1] : '');
    const urlSearch = params.get('search') || '';
    const [search, setSearch] = useState(urlSearch);

    useEffect(() => {
        setSearch(urlSearch);
    }, [urlSearch, path]);

    const submit = (e) => {
        e.preventDefault();
        router.get(path, search.trim() ? { search: search.trim() } : {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <form className="row g-2 align-items-center mb-3" onSubmit={submit}>
            <div className="col-md-6 col-lg-4">
                <input
                    type="search"
                    className="form-control"
                    placeholder="Search username or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="col-auto">
                <button type="submit" className="btn btn--primary btn-sm">Search</button>
            </div>
            {urlSearch && (
                <div className="col-auto">
                    <button
                        type="button"
                        className="btn btn-outline--dark btn-sm"
                        onClick={() => {
                            setSearch('');
                            router.get(path, {}, {
                                preserveState: true,
                                preserveScroll: true,
                                replace: true,
                            });
                        }}
                    >
                        Clear
                    </button>
                </div>
            )}
        </form>
    );
}

export default function Index({ pageTitle, users }) {
    const rows = users?.data ?? [];

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
                    <div className="card-footer">
                        <Pagination links={users.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
