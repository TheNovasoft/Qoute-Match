import { Link, router, useForm } from '@inertiajs/react';
import StatusBadge from '@/Components/Shared/StatusBadge';

export default function DisputeDetail({ dispute }) {
    const { data, setData, post, processing, reset } = useForm({ message: '' });

    const submitReply = (event) => {
        event.preventDefault();
        post(dispute.replyUrl, {
            preserveScroll: true,
            onSuccess: () => reset('message'),
        });
    };

    return (
        <div className="card custom--card">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 className="card-title mb-0">{dispute.subject}</h5>
                <StatusBadge status={dispute.status} />
            </div>
            <div className="card-body">
                <div className="row gy-3 mb-4">
                    <div className="col-md-6">
                        <span className="text-muted d-block">Type</span>
                        <strong>{dispute.typeLabel}</strong>
                    </div>
                    <div className="col-md-6">
                        <span className="text-muted d-block">Raised By</span>
                        <strong>{dispute.raisedBy}</strong>
                    </div>
                    <div className="col-md-6">
                        <span className="text-muted d-block">{dispute.counterpartyLabel}</span>
                        <strong>{dispute.counterpartyName}</strong>
                    </div>
                    <div className="col-md-6">
                        <span className="text-muted d-block">Job</span>
                        <strong>{dispute.jobTitle}</strong>
                    </div>
                    <div className="col-md-6">
                        <span className="text-muted d-block">Quote Amount</span>
                        <strong>{dispute.bidAmount}</strong>
                    </div>
                    <div className="col-md-6">
                        <span className="text-muted d-block">Submitted</span>
                        <strong>{dispute.createdAt}</strong>
                    </div>
                </div>

                <h6 className="mb-3">Conversation</h6>
                <div className="dispute-thread mb-4">
                    {(dispute.messages?.length ? dispute.messages : [{
                        authorLabel: dispute.raisedBy,
                        message: dispute.description,
                        createdAt: dispute.createdAt,
                        isMine: false,
                    }]).map((entry) => (
                        <div
                            key={`${entry.id ?? entry.createdAt}-${entry.authorLabel}`}
                            className={`dispute-thread__item${entry.isMine ? ' is-mine' : ''}`}
                        >
                            <div className="dispute-thread__meta">
                                <strong>{entry.authorLabel}</strong>
                                <span className="text-muted small ms-2">{entry.createdAt}</span>
                            </div>
                            <div className="dispute-thread__body">{entry.message}</div>
                        </div>
                    ))}
                </div>

                {dispute.isActive && (
                    <form onSubmit={submitReply} className="mb-4">
                        <label className="form--label">Add a reply</label>
                        <textarea
                            className="form-control form--control mb-2"
                            rows={4}
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            placeholder="Explain your side or add more details..."
                            required
                        />
                        <button type="submit" className="btn btn--base btn-sm" disabled={processing}>
                            Send Reply
                        </button>
                    </form>
                )}

                {dispute.adminNote && (
                    <>
                        <h6 className="mb-2">Admin Note</h6>
                        <div className="content-panel content-panel--plain mb-4">
                            {dispute.adminNote.split('\n').map((line, i) => (
                                <span key={i}>{line}<br /></span>
                            ))}
                        </div>
                    </>
                )}

                {dispute.resolvedAt && (
                    <p className="text-muted small mb-4">Closed: {dispute.resolvedAt}</p>
                )}

                <div className="d-flex flex-wrap gap-2">
                    <Link href={dispute.indexUrl} className="btn btn-outline--base btn-sm">All Disputes</Link>
                    {dispute.projectUrl && (
                        <Link href={dispute.projectUrl} className="btn btn--base btn-sm">View Project</Link>
                    )}
                </div>
            </div>
        </div>
    );
}
