import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminFilterBar from '@/Components/Admin/AdminFilterBar';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'all', label: 'All', href: '/admin/bids/index' },
    { key: '0', label: 'Pending', href: '/admin/bids/index?status=0' },
    { key: '1', label: 'Hired', href: '/admin/bids/index?status=1' },
    { key: '2', label: 'Done', href: '/admin/bids/index?status=2' },
    { key: '3', label: 'Rejected', href: '/admin/bids/index?status=3' },
    { key: '4', label: 'Withdrawn', href: '/admin/bids/index?status=4' },
];

const STATUS_OPTIONS = [
    { value: '0', label: 'Pending' },
    { value: '1', label: 'Hired' },
    { value: '2', label: 'Done' },
    { value: '3', label: 'Rejected' },
    { value: '4', label: 'Withdrawn' },
];

export default function Index({ pageTitle, bids, jobId = 0 }) {
    const rows = bids?.data ?? [];
    const activeStatus = bids?.filters?.status != null && bids.filters.status !== ''
        ? String(bids.filters.status)
        : 'all';
    const baseUrl = jobId > 0 ? `/admin/bids/index/${jobId}` : '/admin/bids/index';
    const tabs = jobId > 0
        ? STATUS_TABS.map((tab) => ({
            ...tab,
            href: tab.key === 'all' ? baseUrl : `${baseUrl}?status=${tab.key}`,
        }))
        : STATUS_TABS;

    return (
        <AdminLayout pageTitle={pageTitle}>
            {jobId > 0 && (
                <div className="mb-3">
                    <Link href="/admin/bids/index" className="btn btn-sm btn-outline--dark">← All quotes</Link>
                </div>
            )}

            <AdminStatusTabs tabs={tabs} active={activeStatus} />

            <AdminFilterBar
                actionUrl={baseUrl}
                searchPlaceholder="Search request, provider, customer…"
                statusOptions={STATUS_OPTIONS}
                extraParams={jobId > 0 ? {} : {}}
            />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Request</th>
                                <th>Provider</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>ETA</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-muted py-4">No quotes found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        {row.jobDetailUrl ? (
                                            <Link href={row.jobDetailUrl}>{row.jobTitle}</Link>
                                        ) : row.jobTitle}
                                    </td>
                                    <td>{row.providerUsername}</td>
                                    <td>{row.buyerUsername}</td>
                                    <td>{row.amount}</td>
                                    <td>{row.estimatedTime ?? '—'}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td>{row.createdAt}</td>
                                    <td>
                                        <Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Details</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {bids?.links?.length > 3 && (
                    <div className="card-footer">
                        <Pagination links={bids.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
