import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import StatusBadge from '@/Components/Shared/StatusBadge';
import StructuredReviewForm from '@/Components/Shared/StructuredReviewForm';
import StructuredReviewScores from '@/Components/Shared/StructuredReviewScores';
import VerificationBadges from '@/Components/Shared/VerificationBadges';

function StarDisplay({ rating }) {
    return (
        <ul className="rating-list mb-0">
            {[1, 2, 3, 4, 5].map((star) => (
                <li key={star} className="rating-list__item">
                    <i className={`las la-star ${star <= rating ? 'text--warning' : 'text-muted'}`} />
                </li>
            ))}
        </ul>
    );
}

export default function ProjectDetail({
    project,
    role = 'buyer',
    canReport = false,
    dispute = null,
    disputeDetailRoute = null,
    reviewDimensions = [],
    disputeTypes = [],
}) {
    const [showComplete, setShowComplete] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [scores, setScores] = useState({});

    const completeForm = useForm({ review: '', scores: {} });
    const reportForm = useForm({ report_reason: '', dispute_type: 'other' });

    const submitComplete = (event) => {
        event.preventDefault();
        completeForm.transform((data) => ({ ...data, scores }));
        completeForm.post(project.completeUrl, { onSuccess: () => setShowComplete(false) });
    };

    const submitReport = (event) => {
        event.preventDefault();
        reportForm.post(project.reportUrl, { onSuccess: () => setShowReport(false) });
    };

    const showBuyerActions = role === 'buyer' && project.status?.label === 'Reviewing' && canReport;

    return (
        <div className="account-section">
            <div className="card custom--card">
                <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap flex-md-nowrap">
                    <h5 className="card-title mb-0">JOB: {project.jobTitle}</h5>
                    <div className="d-flex gap-2 flex-wrap">
                        {showBuyerActions && (
                            <>
                                <button type="button" className="btn btn--success btn--sm" onClick={() => setShowComplete(true)}>
                                    Complete
                                </button>
                                <button type="button" className="btn btn--danger btn--sm" onClick={() => setShowReport(true)}>
                                    Report / Open Dispute
                                </button>
                            </>
                        )}
                        {role === 'freelancer' && canReport && (
                            <button type="button" className="btn btn--danger btn--sm" onClick={() => setShowReport(true)}>
                                <i className="las la-flag" /> Report / Open Dispute
                            </button>
                        )}
                        {project.uploadUrl && (
                            <Link href={project.uploadUrl} className="btn btn--base btn--sm">Upload Work</Link>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    <div className="details-wrapper">
                        <div className="details-wrapper__item">
                            <div className="flex-grow-1">
                                <h5 className="text-uppercase text--primary mb-4">
                                    <i className="las la-user-secret" /> {role === 'buyer' ? 'Buyer Information' : 'Freelancer Information'}
                                </h5>
                                <div className="mb-3">
                                    <strong>Project Status:</strong>
                                    <p><StatusBadge status={project.status} /></p>
                                </div>
                                <div className="mb-3">
                                    <strong>Assigned At:</strong>
                                    <p className="text-muted">{project.assignedAt}</p>
                                </div>
                                {project.uploadedAt && (
                                    <>
                                        <div className="mb-3">
                                            <strong>Uploaded At:</strong>
                                            <p className="text-muted">{project.uploadedAt}</p>
                                        </div>
                                        <div className="mb-3">
                                            <strong>Total Worked Time:</strong>
                                            <p className="text-muted">{project.workedTime}</p>
                                        </div>
                                    </>
                                )}
                                <div className="mb-3">
                                    <strong>Project Review:</strong>
                                    <p className="text-muted">{project.comments || 'No review provided'}</p>
                                </div>
                            </div>
                            {project.buyerReview && role === 'buyer' && (
                                <div>
                                    <h6 className="text--success mb-1">Freelancer&apos;s Rating for You</h6>
                                    <StarDisplay rating={project.buyerReview.rating} />
                                    {project.buyerReview.text && <p className="mt-2">{project.buyerReview.text}</p>}
                                </div>
                            )}
                        </div>

                        <div className="details-wrapper__item">
                            <div className="flex-grow-1">
                                <h5 className="text-uppercase text--primary mb-4">
                                    <i className="las la-user-tie" /> {role === 'buyer' ? 'Freelancer Information' : 'Buyer Information'}
                                </h5>
                                {role === 'buyer' ? (
                                    <div className="mb-3">
                                        <strong>Freelancer:</strong>
                                        <p className="text-muted d-flex align-items-center flex-wrap gap-1 mb-0">
                                            {project.freelancer.fullname}
                                            <VerificationBadges badges={project.freelancer.verificationBadges} compact />
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mb-3">
                                        <strong>Buyer:</strong>
                                        <p className="text-muted">{project.buyer.fullname}</p>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <strong>Estimated Time:</strong>
                                    <p className="text-muted">{project.bid.estimatedTime}</p>
                                </div>
                                <div className="mb-3">
                                    <strong>Bid Amount:</strong>
                                    <p className="text-muted">{project.bid.amount}</p>
                                </div>
                                <div className="mb-3">
                                    <strong>Bid Quotes:</strong>
                                    <p className="text-muted">{project.bid.quote || 'No comments provided'}</p>
                                </div>
                                {project.uploadCount > 0 && (
                                    <div className="mb-3">
                                        <strong>Total Uploaded:</strong>
                                        <p className="text-muted">{project.uploadCount} Times</p>
                                    </div>
                                )}
                                {project.reportReason && (
                                    <div className="mb-3">
                                        <strong className="text--danger">Report Reason:</strong>
                                        <p className="text--danger">{project.reportReason}</p>
                                    </div>
                                )}
                            </div>
                            {project.review && (
                                <div>
                                    <h6 className="text--success mb-1">
                                        {role === 'buyer' ? 'Your Rating & Review for the Freelancer' : "Buyer's Rating for You"}
                                    </h6>
                                    <StarDisplay rating={project.review.rating} />
                                    {project.review.text && <p className="mt-2">{project.review.text}</p>}
                                    <StructuredReviewScores scores={project.review.scores} compact />
                                </div>
                            )}
                        </div>
                    </div>

                    {project.status?.label === 'Partial' && project.partialReason && (
                        <div className="card border-warning shadow-sm mt-4">
                            <div className="card-header bg-opacity-10">
                                <h6 className="mb-0 fw-semibold text-warning">Partial Completion Reason</h6>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-warning mb-0">
                                    <p className="mb-0 text-dark">{project.partialReason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {project.fileDownloadUrl && (
                        <div className="row mt-4">
                            <div className="col-12 text-center">
                                <h5 className="mb-3">Project File</h5>
                                <a href={project.fileDownloadUrl} className="btn btn-outline--base px-4">
                                    <i className="las la-download" /> Download {project.fileExtension}
                                </a>
                            </div>
                        </div>
                    )}

                    {dispute && (
                        <div className="alert alert-warning mt-4">
                            <strong>Active dispute:</strong> {dispute.subject}
                            {disputeDetailRoute && (
                                <Link href={disputeDetailRoute} className="btn btn--sm btn--base ms-2">View Dispute</Link>
                            )}
                        </div>
                    )}

                    <div className="mt-4 d-flex flex-wrap gap-2">
                        {project.canRehire && project.rehireUrl && (
                            <Link href={project.rehireUrl} method="post" as="button" className="btn btn--base btn-sm">
                                Hire {project.providerName} Again
                            </Link>
                        )}
                        {project.canRehire && project.rehireInviteUrl && (
                            <Link href={project.rehireInviteUrl} method="post" as="button" className="btn btn-outline--base btn-sm">
                                Invite Provider
                            </Link>
                        )}
                        {project.invoiceUrl ? (
                            <Link href={project.invoiceUrl} className="btn btn--base btn-sm">View Invoice</Link>
                        ) : null}
                        <Link href={project.indexUrl} className="btn btn-outline--base btn-sm">Back to Projects</Link>
                    </div>
                </div>
            </div>

            {showComplete && (
                <div className="modal custom--modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Project Completion</h5>
                                <button type="button" className="close" onClick={() => setShowComplete(false)}>
                                    <i className="las la-times" />
                                </button>
                            </div>
                            <form onSubmit={submitComplete}>
                                <div className="modal-body">
                                    <p className="mb-3">Are you sure you want to mark this project as completed?</p>
                                    <StructuredReviewForm dimensions={reviewDimensions} onChange={setScores} />
                                    <div className="form-group">
                                        <label htmlFor="review" className="form--label">Write a Review</label>
                                        <textarea
                                            id="review"
                                            className="form--control"
                                            rows={4}
                                            required
                                            value={completeForm.data.review}
                                            onChange={(e) => completeForm.setData('review', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="submit" className="btn btn--base" disabled={completeForm.processing}>Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showReport && (
                <div className="modal custom--modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Report / Open Dispute</h5>
                                <button type="button" className="close" onClick={() => setShowReport(false)}>
                                    <i className="las la-times" />
                                </button>
                            </div>
                            <form onSubmit={submitReport}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label htmlFor="disputeType" className="form--label">Issue Type</label>
                                        <select
                                            id="disputeType"
                                            className="form--control form-select"
                                            required
                                            value={reportForm.data.dispute_type}
                                            onChange={(e) => reportForm.setData('dispute_type', e.target.value)}
                                        >
                                            {disputeTypes.map((type) => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reportReason" className="form--label">Reason for Reporting</label>
                                        <textarea
                                            id="reportReason"
                                            className="form--control"
                                            rows={4}
                                            required
                                            value={reportForm.data.report_reason}
                                            onChange={(e) => reportForm.setData('report_reason', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="submit" className="btn btn--danger" disabled={reportForm.processing}>Submit Dispute</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
