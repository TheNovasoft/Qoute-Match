import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminFilterBar from '@/Components/Admin/AdminFilterBar';
import Pagination from '@/Components/Shared/Pagination';

export default function Index({ pageTitle, buyers }) {
    const rows = buyers?.data ?? [];

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminFilterBar actionUrl="/admin/buyers" searchPlaceholder="Search customer…" />
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
