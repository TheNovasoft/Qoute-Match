import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending Ticket', href: '/admin/ticket/pending' },
    { key: 'closed', label: 'Closed Ticket', href: '/admin/ticket/closed' },
    { key: 'answered', label: 'Answered Ticket', href: '/admin/ticket/answered' },
    { key: 'all', label: 'All Ticket', href: '/admin/ticket' },
];

export default function Index({ pageTitle, tickets }) {
    const rows = tickets?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={STATUS_TABS} className="mb-3" />

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table--light mb-0">
                        <thead>
                            <tr>
                                <th>Ticket</th>
                                <th>User</th>
                                <th>Subject</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-muted py-4">No tickets found.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.ticket}</td>
                                    <td>{row.name}</td>
                                    <td>{row.subject}</td>
                                    <td className="text-capitalize">{row.priority}</td>
                                    <td><span className={row.status.class}>{row.status.label}</span></td>
                                    <td>{row.createdAt}</td>
                                    <td><Link href={row.detailUrl} className="btn btn-sm btn-outline--primary">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {tickets?.links?.length > 3 && (
                    <div className="card-footer"><Pagination links={tickets.links} /></div>
                )}
            </div>
        </AdminLayout>
    );
}
