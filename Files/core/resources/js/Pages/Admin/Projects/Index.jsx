import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'running', label: 'Running', href: '/admin/project/running' },
    { key: 'reviewing', label: 'Reviewing', href: '/admin/project/reviewing' },
    { key: 'reported', label: 'Reported', href: '/admin/project/reported' },
    { key: 'completed', label: 'Completed', href: '/admin/project/completed' },
    { key: 'rejected', label: 'Rejected', href: '/admin/project/rejected' },
    { key: 'partial', label: 'Partial Complete', href: '/admin/project/partial/completed' },
    { key: 'all', label: 'All Projects', href: '/admin/project/all' },
];

export default function Index({ pageTitle, projects }) {
    const rows = projects?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} className="mb-3" />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Request</th>
                                <th>Provider</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-muted py-4">No projects found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.jobTitle}</td>
                                    <td>{row.providerUsername}</td>
                                    <td>{row.buyerUsername}</td>
                                    <td>{row.amount}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td>{row.createdAt}</td>
                                    <td><Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">Details</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {projects?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={projects.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}
