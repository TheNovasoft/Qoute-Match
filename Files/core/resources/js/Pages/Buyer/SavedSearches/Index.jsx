import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import ConfirmModal from '@/Components/Shared/ConfirmModal';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ pageTitle, searches }) {
    const [pendingDeleteUrl, setPendingDeleteUrl] = useState(null);

    const remove = (url) => {
        setPendingDeleteUrl(url);
    };

    const confirmRemove = () => {
        if (!pendingDeleteUrl) return;
        router.post(pendingDeleteUrl, {}, { onFinish: () => setPendingDeleteUrl(null) });
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

            <ConfirmModal
                show={!!pendingDeleteUrl}
                title="Remove saved search?"
                message="This saved filter will be deleted. You can always save the search again later."
                confirmLabel="Remove"
                confirmClass="btn-outline--danger"
                onConfirm={confirmRemove}
                onCancel={() => setPendingDeleteUrl(null)}
            />
        </BuyerMasterLayout>
    );
}
