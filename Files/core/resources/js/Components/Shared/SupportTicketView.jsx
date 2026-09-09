import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import StatusBadge from '@/Components/Shared/StatusBadge';
import ConfirmModal from '@/Components/Shared/ConfirmModal';

export default function SupportTicketView({ ticket, messages = [] }) {
    const form = useForm({ message: '', attachments: [] });
    const [confirmClose, setConfirmClose] = useState(false);

    const submitReply = (event) => {
        event.preventDefault();
        form.post(ticket.replyUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset('message', 'attachments'),
        });
    };

    const closeTicket = () => {
        setConfirmClose(true);
    };

    const confirmCloseTicket = () => {
        router.post(ticket.closeUrl, {}, { onFinish: () => setConfirmClose(false) });
    };

    return (
        <div className="row justify-content-center gy-4 support-ticket-view support-ticket-shell">
            <div className="col-lg-9">
                <div className="card custom--card support-ticket-card mb-4">
                    <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                            <h5 className="card-title mb-1">Ticket #{ticket.ticket}</h5>
                            <div className="text-muted small">{ticket.subject}</div>
                        </div>
                        <StatusBadge status={ticket.status} />
                    </div>
                    <div className="card-body">
                        <div className="row gy-2">
                            <div className="col-sm-6"><strong>Priority:</strong> <StatusBadge status={ticket.priority} /></div>
                            <div className="col-sm-6"><strong>Opened At:</strong> {ticket.createdAt}</div>
                            <div className="col-sm-6"><strong>Last Reply:</strong> {ticket.lastReply}</div>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                            {!ticket.isClosed && (
                                <button type="button" className="btn btn--danger btn--sm" onClick={closeTicket}>
                                    Close Support
                                </button>
                            )}
                            <a href={ticket.indexUrl} className="btn btn-outline--base btn--sm">All Tickets</a>
                        </div>
                    </div>
                </div>

                <div className="card custom--card support-ticket-card mb-4">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Conversation</h5>
                    </div>
                    <div className="card-body">
                        {messages.length === 0 ? (
                            <p className="text-muted mb-0">No messages yet.</p>
                        ) : (
                            messages.map((message) => (
                                <div key={message.id} className={`chat-item ${message.isAdmin ? '' : 'reply'}`}>
                                    <span className="chat-item__thumb">
                                        <img src={message.senderImage} alt="" />
                                    </span>
                                    <div className="chat-item__content">
                                        <p className="chat-item__name">{message.senderName}</p>
                                        <p className="chat-item__time"><small><i className="far fa-clock" /> {message.createdAt}</small></p>
                                        <p className="chat-item__message" style={{ whiteSpace: 'pre-wrap' }}>{message.message}</p>
                                        {!!(message.attachments?.length) && (
                                            <div className="d-flex flex-wrap gap-2 mt-2">
                                                {message.attachments.map((file) => (
                                                    <a
                                                        key={file.id}
                                                        href={file.downloadUrl}
                                                        className="atach-preview support-attach-chip"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <img src={file.previewImage} alt="" width="28" height="28" />
                                                        <span>Download{file.size ? ` · ${file.size}` : ''}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {ticket.isClosed ? (
                    <div className="alert alert-warning mb-0">This ticket is closed. You can no longer reply.</div>
                ) : (
                    <div className="card custom--card support-ticket-card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Reply to this ticket</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={submitReply} encType="multipart/form-data">
                                <div className="form-group mb-3">
                                    <label className="form--label required">Message</label>
                                    <textarea
                                        id="ticket-reply-box"
                                        className="form--control"
                                        rows={4}
                                        placeholder="Write your reply here..."
                                        value={form.data.message}
                                        onChange={(e) => form.setData('message', e.target.value)}
                                        required
                                    />
                                    {form.errors.message && <div className="text--danger small mt-1">{form.errors.message}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form--label">Attachments (optional)</label>
                                    <input
                                        type="file"
                                        className="form--control"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        onChange={(e) => form.setData('attachments', Array.from(e.target.files || []))}
                                    />
                                    {form.errors.attachments && <div className="text--danger small mt-1">{form.errors.attachments}</div>}
                                    {!!form.data.attachments?.length && (
                                        <div className="small text-muted mt-2">{form.data.attachments.length} file(s) selected</div>
                                    )}
                                </div>
                                <button type="submit" className="btn btn--base btn--lg w-100" disabled={form.processing}>
                                    <i className="las la-paper-plane" /> {form.processing ? 'Sending...' : 'Send Reply'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                show={confirmClose}
                title="Close this support ticket?"
                message="You will not be able to reply after closing. Open a new ticket if you need more help later."
                confirmLabel="Close ticket"
                confirmClass="btn-outline--danger"
                onConfirm={confirmCloseTicket}
                onCancel={() => setConfirmClose(false)}
            />
        </div>
    );
}
