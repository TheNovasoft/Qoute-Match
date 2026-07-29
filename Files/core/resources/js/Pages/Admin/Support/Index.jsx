import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminFilterBar from '@/Components/Admin/AdminFilterBar';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';
import Pagination from '@/Components/Shared/Pagination';

const TICKET_TABS = [
    { key: 'all', label: 'All', href: '/admin/ticket' },
    { key: 'pending', label: 'Pending', href: '/admin/ticket/pending' },
    { key: 'answered', label: 'Answered', href: '/admin/ticket/answered' },
    { key: 'closed', label: 'Closed', href: '/admin/ticket/closed' },
];

const PRIORITY_OPTIONS = [
    { value: '1', label: 'Low' },
    { value: '2', label: 'Medium' },
    { value: '3', label: 'High' },
];

export default function Index({ pageTitle, tickets }) {
    const rows = tickets?.data ?? [];
    const scope = tickets?.scope || 'all';
    const filterUrl = {
        all: '/admin/ticket',
        pending: '/admin/ticket/pending',
        answered: '/admin/ticket/answered',
        closed: '/admin/ticket/closed',
    }[scope] || '/admin/ticket';

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={TICKET_TABS} active={scope} />

            <AdminFilterBar
                actionUrl={filterUrl}
                searchPlaceholder="Search ticket, subject, name…"
                priorityOptions={PRIORITY_OPTIONS}
            />

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
