import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';

export default function Detail({ pageTitle, review }) {
    const approveForm = useForm({});
    const hideForm = useForm({ admin_note: review.adminNote ?? '' });
    const verifyForm = useForm({});
    const investigateForm = useForm({
        investigation_status: review.investigation?.status ?? 0,
        provider_complaint: review.providerComplaint ?? '',
        admin_note: review.adminNote ?? '',
    });
    const replyForm = useForm({ admin_reply: review.adminReply ?? '' });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <Link href={review.indexUrl} className="btn btn-sm btn-outline--dark">← Reviews</Link>
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h5 className="mb-0">Review — {review.rating}/5</h5>
                            <div className="d-flex gap-1 flex-wrap">
                                <span className={review.status.class}>{review.status.label}</span>
                                {review.isVerified && <span className="badge badge--success">Verified</span>}
                                {review.investigation?.status > 0 && (
                                    <span className="badge badge--warning">{review.investigation.label}</span>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3 mb-4">
                                <div className="col-md-6"><span className="text-muted d-block">Submitted</span><strong>{review.createdAt}</strong></div>
                                {review.provider && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Provider</span>
                                        <a href={review.provider.detailUrl}>{review.provider.fullname} (@{review.provider.username})</a>
                                    </div>
                                )}
                                {review.buyer && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Customer</span>
                                        <a href={review.buyer.detailUrl}>{review.buyer.fullname} (@{review.buyer.username})</a>
                                    </div>
                                )}
                                {review.job && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Request</span>
                                        <a href={review.job.detailUrl}>{review.job.title}</a>
                                    </div>
                                )}
                            </div>

                            <h6>Comment</h6>
                            <div className="content-panel mb-4">{review.review}</div>

                            {review.scores?.length > 0 && (
                                <>
                                    <h6>Dimension scores</h6>
                                    <ul className="list-unstyled mb-4">
                                        {review.scores.map((score) => (
                                            <li key={score.label} className="mb-2">
                                                <span className="text-muted">{score.label}:</span> <strong>{score.score}/5</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {(review.providerComplaint || review.adminReply) && (
                                <div className="border rounded p-3 bg-light">
                                    {review.providerComplaint && (
                                        <div className="mb-3">
                                            <h6 className="mb-1">Provider complaint</h6>
                                            <p className="mb-0 small">{review.providerComplaint}</p>
                                        </div>
                                    )}
                                    {review.adminReply && (
                                        <div>
                                            <h6 className="mb-1">Admin reply</h6>
                                            <p className="mb-0 small">{review.adminReply}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {/* Approve */}
                    {review.actions.approveUrl && (
                        <div className="card shadow-sm mb-3">
                            <div className="card-header bg-white"><h6 className="mb-0">Approve</h6></div>
                            <div className="card-body">
                                <p className="small text-muted">Publish this review on the provider profile.</p>
                                <button
                                    type="button"
                                    className="btn btn--success btn-sm w-100"
                                    disabled={approveForm.processing}
                                    onClick={() => approveForm.post(review.actions.approveUrl)}
                                >
                                    Approve &amp; publish
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hide abusive */}
                    {review.actions.hideUrl && (
                        <div className="card shadow-sm mb-3">
                            <div className="card-header bg-white"><h6 className="mb-0">Hide abusive review</h6></div>
                            <div className="card-body">
                                <div className="form-group mb-2">
                                    <label className="small">Reason / note (optional)</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        rows={3}
                                        value={hideForm.data.admin_note}
                                        onChange={(e) => hideForm.setData('admin_note', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn btn--danger btn-sm w-100"
                                    disabled={hideForm.processing}
                                    onClick={() => hideForm.post(review.actions.hideUrl)}
                                >
                                    Hide from profile
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mark verified */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-header bg-white"><h6 className="mb-0">Mark as verified</h6></div>
                        <div className="card-body">
                            <p className="small text-muted mb-2">
                                {review.isVerified
                                    ? 'This review currently shows a verified badge.'
                                    : 'Mark genuine completed-job reviews as verified.'}
                            </p>
                            <button
                                type="button"
                                className={`btn btn-sm w-100 ${review.isVerified ? 'btn-outline--warning' : 'btn--primary'}`}
                                disabled={verifyForm.processing}
                                onClick={() => verifyForm.post(review.actions.verifyUrl)}
                            >
                                {review.isVerified ? 'Remove verified badge' : 'Mark review as verified'}
                            </button>
                        </div>
                    </div>

                    {/* Investigate disputed */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-header bg-white"><h6 className="mb-0">Investigate disputed review</h6></div>
                        <div className="card-body">
                            <div className="form-group mb-2">
                                <label className="small">Investigation status</label>
                                <select
                                    className="form-control form-control-sm"
                                    value={investigateForm.data.investigation_status}
                                    onChange={(e) => investigateForm.setData('investigation_status', Number(e.target.value))}
                                >
                                    <option value={0}>None</option>
                                    <option value={1}>Open dispute</option>
                                    <option value={2}>Investigating</option>
                                    <option value={3}>Resolved</option>
                                </select>
                            </div>
                            <div className="form-group mb-2">
                                <label className="small">Provider complaint notes</label>
                                <textarea
                                    className="form-control form-control-sm"
                                    rows={3}
                                    placeholder="What did the provider complain about?"
                                    value={investigateForm.data.provider_complaint}
                                    onChange={(e) => investigateForm.setData('provider_complaint', e.target.value)}
                                />
                            </div>
                            <div className="form-group mb-2">
                                <label className="small">Internal admin note</label>
                                <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={investigateForm.data.admin_note}
                                    onChange={(e) => investigateForm.setData('admin_note', e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn--warning btn-sm w-100"
                                disabled={investigateForm.processing}
                                onClick={() => investigateForm.post(review.actions.investigateUrl)}
                            >
                                Save investigation
                            </button>
                        </div>
                    </div>

                    {/* Reply to provider */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-header bg-white"><h6 className="mb-0">Reply to provider complaint</h6></div>
                        <div className="card-body">
                            <div className="form-group mb-2">
                                <label className="small">Reply message</label>
                                <textarea
                                    className="form-control form-control-sm"
                                    rows={4}
                                    placeholder="Explain your decision to the provider…"
                                    value={replyForm.data.admin_reply}
                                    onChange={(e) => replyForm.setData('admin_reply', e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn--primary btn-sm w-100"
                                disabled={replyForm.processing || !replyForm.data.admin_reply?.trim()}
                                onClick={() => replyForm.post(review.actions.replyUrl)}
                            >
                                Send reply to provider
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
