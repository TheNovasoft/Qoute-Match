import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, verification }) {
    const approveForm = useForm({});
    const rejectForm = useForm({ admin_note: '' });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={verification.indexUrl || '/admin/provider-verifications'} />
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{verification.typeLabel}</h5>
                            <span className={verification.status.class}>{verification.status.label}</span>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3 mb-4">
                                <div className="col-md-6"><span className="text-muted d-block">Submitted</span><strong>{verification.submittedAt}</strong></div>
                                {verification.reviewedAt && (
                                    <div className="col-md-6"><span className="text-muted d-block">Reviewed</span><strong>{verification.reviewedAt}</strong></div>
                                )}
                                {verification.referenceNumber && (
                                    <div className="col-md-6"><span className="text-muted d-block">Reference</span><strong>{verification.referenceNumber}</strong></div>
                                )}
                                {verification.expiresAt && (
                                    <div className="col-md-6"><span className="text-muted d-block">Expires</span><strong>{verification.expiresAt}</strong></div>
                                )}
                                {verification.provider && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Provider</span>
                                        <a href={verification.provider.detailUrl}>{verification.provider.fullname} (@{verification.provider.username})</a>
                                    </div>
                                )}
                            </div>

                            {verification.documentUrl && (
                                <p className="mb-3">
                                    <a href={verification.documentUrl} className="btn btn-sm btn-outline--primary" target="_blank" rel="noreferrer">
                                        View document
                                    </a>
                                </p>
                            )}

                            {verification.adminNote && (
                                <div className="alert alert-warning mb-0">
                                    <strong>Admin note:</strong> {verification.adminNote}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {verification.actions.approveUrl && (
                        <div className="card shadow-sm admin-job-actions">
                            <div className="card-header admin-job-actions__header">
                                <h6 className="mb-0">Review Badge</h6>
                            </div>
                            <div className="card-body admin-job-actions__body">
                                <form
                                    className="mb-3"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (window.confirm('Approve this verification badge?')) {
                                            approveForm.post(verification.actions.approveUrl);
                                        }
                                    }}
                                >
                                    <button type="submit" className="btn btn--success btn-sm admin-job-actions__btn admin-job-actions__btn--approve w-100" disabled={approveForm.processing}>
                                        <i className="las la-check-circle" aria-hidden="true" />
                                        Approve badge
                                    </button>
                                </form>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        rejectForm.post(verification.actions.rejectUrl);
                                    }}
                                >
                                    <div className="form-group mb-2">
                                        <label className="admin-job-actions__label">Rejection reason</label>
                                        <textarea
                                            className="form-control admin-job-actions__textarea"
                                            rows={4}
                                            value={rejectForm.data.admin_note}
                                            onChange={(e) => rejectForm.setData('admin_note', e.target.value)}
                                            placeholder="Explain why this badge is being rejected..."
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-outline--danger btn-sm admin-job-actions__btn admin-job-actions__btn--reject w-100" disabled={rejectForm.processing}>
                                        <i className="las la-times-circle" aria-hidden="true" />
                                        Reject badge
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
