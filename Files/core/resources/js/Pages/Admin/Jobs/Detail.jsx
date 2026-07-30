import { Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

function FieldList({ fields }) {
    if (!fields?.length) return <p className="text-muted mb-0">No fields.</p>;
    return (
        <dl className="row mb-0">
            {fields.map((field, index) => (
                <div key={index} className="col-md-6 mb-3">
                    <dt className="text-muted small">{field.name}</dt>
                    <dd className="mb-0">
                        {field.isFile ? (
                            <a href={field.value} target="_blank" rel="noreferrer">Download</a>
                        ) : (
                            field.value
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function Detail({ pageTitle, job }) {
    const approveForm = useForm({});
    const rejectForm = useForm({ reason: '' });
    const deleteForm = useForm({});

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={job.indexUrl} />
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h5 className="mb-0">{job.title}</h5>
                            <div className="d-flex gap-2">
                                <span className={job.status.class}>{job.status.label}</span>
                                <span className={job.approval.class}>{job.approval.label}</span>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3 mb-4">
                                <div className="col-md-6"><span className="text-muted d-block">Budget</span><strong>{job.budget}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Deadline</span><strong>{job.deadline}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Category</span><strong>{job.category} / {job.subcategory}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Posted</span><strong>{job.createdAt}</strong></div>
                                {job.buyer && (
                                    <div className="col-md-6">
                                        <span className="text-muted d-block">Customer</span>
                                        <a href={job.buyer.detailUrl}>{job.buyer.fullname} (@{job.buyer.username})</a>
                                    </div>
                                )}
                                <div className="col-md-6">
                                    <span className="text-muted d-block">Quotes / Interviews</span>
                                    <strong>{job.widget.totalBids} / {job.widget.totalInterviews}</strong>
                                </div>
                            </div>

                            <h6>Description</h6>
                            <div className="content-panel mb-4" dangerouslySetInnerHTML={{ __html: job.description }} />

                            {job.skills?.length > 0 && (
                                <>
                                    <h6>Skills</h6>
                                    <p className="mb-4">{job.skills.join(', ')}</p>
                                </>
                            )}

                            <h6>Request form</h6>
                            <FieldList fields={job.requestFields} />

                            {job.rejectionReason && (
                                <div className="alert alert-danger mt-3 mb-0">
                                    <strong>Rejection reason:</strong> {job.rejectionReason}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm admin-job-actions">
                        <div className="card-header admin-job-actions__header">
                            <h6 className="mb-0">Actions</h6>
                        </div>
                        <div className="card-body admin-job-actions__body">
                            <Link
                                href={job.actions.bidsUrl}
                                className="btn btn-sm admin-job-actions__btn"
                                style={{
                                    background: '#0071e3',
                                    border: '2px solid #000',
                                    color: '#fff',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    minHeight: 42,
                                    padding: '10px 14px',
                                    width: '100%',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    const s = e.currentTarget.style;
                                    s.setProperty('background', '#005bb5', 'important');
                                    s.setProperty('border-color', '#000', 'important');
                                    s.setProperty('color', '#fff', 'important');
                                    const icon = e.currentTarget.querySelector('i');
                                    if (icon) icon.style.setProperty('color', '#fff', 'important');
                                }}
                                onMouseLeave={(e) => {
                                    const s = e.currentTarget.style;
                                    s.setProperty('background', '#0071e3', 'important');
                                    s.setProperty('border-color', '#000', 'important');
                                    s.setProperty('color', '#fff', 'important');
                                    const icon = e.currentTarget.querySelector('i');
                                    if (icon) icon.style.setProperty('color', '#fff', 'important');
                                }}
                            >
                                <i className="las la-file-invoice" aria-hidden="true" style={{ color: '#fff' }} />
                                View quotes
                            </Link>

                            {job.actions.approveUrl && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (window.confirm('Approve this request?')) {
                                            approveForm.post(job.actions.approveUrl);
                                        }
                                    }}
                                >
                                    <button type="submit" className="btn btn--success btn-sm admin-job-actions__btn admin-job-actions__btn--approve" disabled={approveForm.processing}>
                                        <i className="las la-check-circle" aria-hidden="true" />
                                        Approve request
                                    </button>
                                </form>
                            )}

                            {job.actions.rejectUrl && (
                                <form
                                    className="admin-job-actions__reject"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        rejectForm.post(job.actions.rejectUrl);
                                    }}
                                >
                                    <div className="form-group mb-2">
                                        <label className="admin-job-actions__label">Rejection reason</label>
                                        <textarea
                                            className="form-control admin-job-actions__textarea"
                                            rows={3}
                                            value={rejectForm.data.reason}
                                            onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                            placeholder="Explain why this request is being rejected..."
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-outline--danger btn-sm admin-job-actions__btn admin-job-actions__btn--reject" disabled={rejectForm.processing}>
                                        <i className="las la-times-circle" aria-hidden="true" />
                                        Reject request
                                    </button>
                                </form>
                            )}

                            <div className="admin-job-actions__delete">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (window.confirm('Delete this request permanently?')) {
                                            deleteForm.post(job.actions.deleteUrl);
                                        }
                                    }}
                                >
                                    <button type="submit" className="btn btn-outline--danger btn-sm admin-job-actions__btn admin-job-actions__btn--delete" disabled={deleteForm.processing}>
                                        <i className="las la-trash" aria-hidden="true" />
                                        Delete request
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
