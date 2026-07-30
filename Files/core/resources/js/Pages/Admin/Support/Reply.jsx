import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Reply({ pageTitle, ticket }) {
    const replyForm = useForm({ message: '', attachments: [] });
    const closeForm = useForm({});

    const submitReply = (e) => {
        e.preventDefault();
        replyForm.post(ticket.actions.replyUrl, { forceFormData: true });
    };

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={ticket.indexUrl} />
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <span className={ticket.status.class}>{ticket.status.label}</span>
                        <span className="ms-2">#{ticket.ticket} — {ticket.subject}</span>
                    </div>
                    {!ticket.isClosed && (
                        <button type="button" className="btn btn-sm btn--danger" disabled={closeForm.processing}
                            onClick={() => { if (window.confirm('Close this ticket?')) closeForm.post(ticket.actions.closeUrl); }}>
                            Close Ticket
                        </button>
                    )}
                </div>
                <div className="card-body">
                    <div className="text-muted small mb-3">{ticket.name} · {ticket.email}</div>

                    {!ticket.isClosed && (
                        <form onSubmit={submitReply} className="mb-4">
                            <div className="form-group mb-3">
                                <textarea className="form-control" rows={4} required placeholder="Enter reply..."
                                    value={replyForm.data.message} onChange={(e) => replyForm.setData('message', e.target.value)} />
                            </div>
                            <div className="form-group mb-3">
                                <input type="file" className="form-control" multiple
                                    onChange={(e) => replyForm.setData('attachments', Array.from(e.target.files))} />
                            </div>
                            <button type="submit" className="btn btn--primary" disabled={replyForm.processing}>Reply</button>
                        </form>
                    )}

                    <div className="d-flex flex-column gap-3">
                        {(ticket.messages ?? []).map((msg) => (
                            <MessageRow key={msg.id} msg={msg} />
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function MessageRow({ msg }) {
    const deleteForm = useForm({});

    return (
        <div className={`border rounded p-3 ${msg.isAdmin ? 'border-success bg-light' : 'border-primary'}`}>
            <div className="d-flex justify-content-between align-items-start mb-2">
                <strong>{msg.isAdmin ? 'Admin' : 'Customer'}</strong>
                <div className="d-flex gap-2 align-items-center">
                    <span className="text-muted small">{msg.createdAt}</span>
                    <button type="button" className="btn btn-sm btn-outline--danger" disabled={deleteForm.processing}
                        onClick={() => { if (window.confirm('Delete message?')) deleteForm.post(msg.deleteUrl); }}>Delete</button>
                </div>
            </div>
            <p className="mb-0">{msg.message}</p>
        </div>
    );
}
