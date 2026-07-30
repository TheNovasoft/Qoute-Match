import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

function BuyerSearch() {
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

export default function Index({ pageTitle, buyers }) {
    const rows = buyers?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} className="mb-3" />
            <BuyerSearch />

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
