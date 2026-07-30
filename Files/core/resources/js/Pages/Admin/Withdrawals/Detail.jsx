import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, withdrawal }) {
    const approveForm = useForm({ id: withdrawal.id, details: '' });
    const rejectForm = useForm({ id: withdrawal.id, details: '' });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={withdrawal.indexUrl} />
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{withdrawal.trx}</h5>
                            <span className={withdrawal.status.class}>{withdrawal.status.label}</span>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3 mb-4">
                                <div className="col-md-6"><span className="text-muted d-block">User</span><strong>{withdrawal.owner}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Method</span><strong>{withdrawal.method}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Amount</span><strong>{withdrawal.amount}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Charge</span><strong>{withdrawal.charge}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">After Charge</span><strong>{withdrawal.afterCharge}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Date</span><strong>{withdrawal.createdAt}</strong></div>
                            </div>
                            {withdrawal.adminFeedback && (
                                <>
                                    <h6>Admin Feedback</h6>
                                    <div className="content-panel mb-3">{withdrawal.adminFeedback}</div>
                                </>
                            )}
                            {withdrawal.details && (
                                <>
                                    <h6>Withdrawal Info</h6>
                                    <pre className="content-panel small">{withdrawal.details}</pre>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {(withdrawal.actions.approveUrl || withdrawal.actions.rejectUrl) && (
                        <div className="card shadow-sm">
                            <div className="card-header bg-white"><h6 className="mb-0">Moderation</h6></div>
                            <div className="card-body">
                                {withdrawal.actions.approveUrl && (
                                    <form className="mb-4" onSubmit={(e) => { e.preventDefault(); approveForm.post(withdrawal.actions.approveUrl); }}>
                                        <div className="form-group mb-3">
                                            <label>Note (optional)</label>
                                            <textarea className="form-control" rows={2} value={approveForm.data.details}
                                                onChange={(e) => approveForm.setData('details', e.target.value)} />
                                        </div>
                                        <button type="submit" className="btn btn--success w-100" disabled={approveForm.processing}>Approve</button>
                                    </form>
                                )}
                                {withdrawal.actions.rejectUrl && (
                                    <form onSubmit={(e) => { e.preventDefault(); rejectForm.post(withdrawal.actions.rejectUrl); }}>
                                        <div className="form-group mb-3">
                                            <label>Rejection note</label>
                                            <textarea className="form-control" rows={2} value={rejectForm.data.details}
                                                onChange={(e) => rejectForm.setData('details', e.target.value)} />
                                        </div>
                                        <button type="submit" className="btn btn--danger w-100" disabled={rejectForm.processing}>Reject</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
