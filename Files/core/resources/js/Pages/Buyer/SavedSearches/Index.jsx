import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';
import { Link, router } from '@inertiajs/react';

export default function Index({ pageTitle, searches }) {
    const remove = (url) => {
        if (!window.confirm('Remove this saved search?')) return;
        router.post(url);
    };

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            <div className="card custom--card">
                <div className="card-body p-0">
                    {searches.data?.length ? (
                        <div className="table-responsive table-responsive--sm">
                            <table className="table table--light style--two">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Saved</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searches.data.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.name}</td>
                                            <td>{row.typeLabel}</td>
                                            <td>{row.createdAt}</td>
                                            <td>
                                                <div className="button--group">
                                                    <Link href={row.url} className="btn btn-sm btn-outline--primary">
                                                        Open
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline--danger"
                                                        onClick={() => remove(row.deleteUrl)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4">
                            <EmptyState message="No saved searches yet. On the Providers page, apply filters and click Save Search." />
                        </div>
                    )}
                </div>
            </div>
            {searches.links?.length > 3 && (
                <div className="mt-3">
                    <Pagination links={searches.links} />
                </div>
            )}
        </BuyerMasterLayout>
    );
}
