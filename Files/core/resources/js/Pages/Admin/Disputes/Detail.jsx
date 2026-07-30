import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, dispute }) {
    const reviewForm = useForm({ admin_note: dispute.adminNote ?? '' });
    const resolveForm = useForm({ admin_note: '' });
    const rejectForm = useForm({ admin_note: '' });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={dispute.indexUrl} />
            </div>
            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{dispute.subject}</h5>
                            <span className={dispute.status.class}>{dispute.status.label}</span>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3 mb-4">
                                <div className="col-md-6"><span className="text-muted d-block">Type</span><strong>{dispute.typeLabel}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Raised By</span><strong>{dispute.raisedBy}</strong></div>
                                {dispute.buyer && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Customer</span>
                                        <a href={dispute.buyer.detailUrl}>{dispute.buyer.fullname} (@{dispute.buyer.username})</a>
                                    </div>
                                )}
                                {dispute.provider && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Provider</span>
                                        <a href={dispute.provider.detailUrl}>{dispute.provider.fullname} (@{dispute.provider.username})</a>
                                    </div>
                                )}
                                {dispute.job && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Request</span>
                                        <a href={dispute.job.detailUrl}>{dispute.job.title}</a>
                                    </div>
                                )}
                                {dispute.bid && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Quote</span>
                                        <a href={dispute.bid.detailUrl}>{dispute.bid.amount} — View quote</a>
                                    </div>
                                )}
                                <div className="col-md-6"><span className="text-muted d-block">Submitted</span><strong>{dispute.createdAt}</strong></div>
                            </div>

                            <h6>Description</h6>
                            <div className="content-panel mb-3">{dispute.description}</div>

                            {dispute.adminNote && (
                                <>
                                    <h6>Admin Note</h6>
                                    <div className="content-panel content-panel--plain mb-3">{dispute.adminNote}</div>
                                </>
                            )}

                            {dispute.resolvedAt && (
                                <p className="text-muted small mb-0">Closed: {dispute.resolvedAt}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {!dispute.isClosed && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white"><h6 className="mb-0">Moderation</h6></div>
                            <div className="card-body">
                                {dispute.isOpen && (
                                    <form
                                        className="mb-4"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            reviewForm.post(dispute.actions.inReviewUrl);
                                        }}
                                    >
                                        <div className="form-group mb-3">
                                            <label>Note (optional)</label>
                                            <textarea className="form-control" rows={3} value={reviewForm.data.admin_note} onChange={(e) => reviewForm.setData('admin_note', e.target.value)} />
                                        </div>
                                        <button type="submit" className="btn btn--primary w-100" disabled={reviewForm.processing}>Mark In Review</button>
                                    </form>
                                )}

                                <form
                                    className="mb-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        resolveForm.post(dispute.actions.resolveUrl);
                                    }}
                                >
                                    <div className="form-group mb-3">
                                        <label>Resolution note</label>
                                        <textarea className="form-control" rows={3} value={resolveForm.data.admin_note} onChange={(e) => resolveForm.setData('admin_note', e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn--success w-100" disabled={resolveForm.processing}>Resolve Dispute</button>
                                </form>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!window.confirm('Reject this dispute? A note is required.')) return;
                                        rejectForm.post(dispute.actions.rejectUrl);
                                    }}
                                >
                                    <div className="form-group mb-3">
                                        <label>Rejection reason *</label>
                                        <textarea className="form-control" rows={3} required value={rejectForm.data.admin_note} onChange={(e) => rejectForm.setData('admin_note', e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn--danger w-100" disabled={rejectForm.processing}>Reject &amp; Close</button>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="card shadow-sm">
                        <div className="card-header bg-white"><h6 className="mb-0">Quick Links</h6></div>
                        <div className="card-body d-grid gap-2">
                            <AdminBackLink href={dispute.indexUrl} label="← Back to list" className="btn btn-outline--primary btn-sm" />
                            <Link href={dispute.dashboardUrl} className="btn btn-outline--primary btn-sm">Marketplace Dashboard</Link>
                            {dispute.project && (
                                <a href={dispute.project.detailUrl} className="btn btn-outline--dark btn-sm">Project Details</a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
