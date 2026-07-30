import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, deposit }) {
    const approveForm = useForm({});
    const rejectForm = useForm({ id: deposit.id, message: '' });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={deposit.indexUrl} />
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{deposit.trx}</h5>
                            <span className={deposit.status.class}>{deposit.status.label}</span>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3 mb-4">
                                <div className="col-md-6"><span className="text-muted d-block">User</span><strong>{deposit.owner}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Gateway</span><strong>{deposit.gateway}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Amount</span><strong>{deposit.amount}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Charge</span><strong>{deposit.charge}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Final Amount</span><strong>{deposit.finalAmount}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Date</span><strong>{deposit.createdAt}</strong></div>
                            </div>
                            {deposit.adminFeedback && (
                                <>
                                    <h6>Admin Feedback</h6>
                                    <div className="content-panel mb-3">{deposit.adminFeedback}</div>
                                </>
                            )}
                            {deposit.details && (
                                <>
                                    <h6>Payment Details</h6>
                                    <pre className="content-panel small">{deposit.details}</pre>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {(deposit.actions.approveUrl || deposit.actions.rejectUrl) && (
                        <div className="card shadow-sm">
                            <div className="card-header bg-white"><h6 className="mb-0">Moderation</h6></div>
                            <div className="card-body">
                                {deposit.actions.approveUrl && (
                                    <button type="button" className="btn btn--success w-100 mb-3" disabled={approveForm.processing}
                                        onClick={() => approveForm.post(deposit.actions.approveUrl)}>Approve Deposit</button>
                                )}
                                {deposit.actions.rejectUrl && (
                                    <form onSubmit={(e) => { e.preventDefault(); rejectForm.post(deposit.actions.rejectUrl); }}>
                                        <div className="form-group mb-3">
                                            <label>Rejection message</label>
                                            <textarea className="form-control" rows={3} required value={rejectForm.data.message}
                                                onChange={(e) => rejectForm.setData('message', e.target.value)} />
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
