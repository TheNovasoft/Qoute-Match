import { useForm } from '@inertiajs/react';

export default function SupportTicketCreate({ storeUrl, indexUrl }) {
    const form = useForm({
        priority: '2',
        subject: '',
        message: '',
        attachments: [],
    });

    const submit = (event) => {
        event.preventDefault();
        form.transform((data) => {
            const payload = {
                priority: data.priority,
                subject: data.subject,
                message: data.message,
            };
            if (data.attachments?.length) {
                payload.attachments = data.attachments;
            }
            return payload;
        }).post(storeUrl, {
            forceFormData: true,
            preserveScroll: false,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <div className="support-ticket-shell">
            <div className="card custom--card support-ticket-card">
                <div className="card-body">
                    <div className="support-ticket-intro mb-4">
                        <h5 className="mb-1">Open a support ticket</h5>
                        <p className="text-muted mb-0">Tell us what you need help with. Attachments are optional (png, jpg, pdf, doc — max 5 files, 5MB each).</p>
                    </div>
                    <form onSubmit={submit} encType="multipart/form-data">
                        <div className="form-group mb-3">
                            <label className="form--label d-block required">Priority</label>
                            <div className="d-flex gap-3 flex-wrap">
                                {[
                                    { value: '1', label: 'Low' },
                                    { value: '2', label: 'Medium' },
                                    { value: '3', label: 'High' },
                                ].map((opt) => (
                                    <label key={opt.value} className="form-check">
                                        <input
                                            type="radio"
                                            name="priority"
                                            className="form-check-input"
                                            value={opt.value}
                                            checked={form.data.priority === opt.value}
                                            onChange={(e) => form.setData('priority', e.target.value)}
                                            required
                                        />
                                        <span className="form-check-label">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            {form.errors.priority && <div className="text--danger small mt-1">{form.errors.priority}</div>}
                        </div>
                        <div className="form-group mb-3">
                            <label className="form--label required">Subject</label>
                            <input
                                className="form--control"
                                value={form.data.subject}
                                onChange={(e) => form.setData('subject', e.target.value)}
                                required
                            />
                            {form.errors.subject && <div className="text--danger small mt-1">{form.errors.subject}</div>}
                        </div>
                        <div className="form-group mb-3">
                            <label className="form--label required">Message</label>
                            <textarea
                                className="form--control"
                                rows={5}
                                value={form.data.message}
                                onChange={(e) => form.setData('message', e.target.value)}
                                required
                            />
                            {form.errors.message && <div className="text--danger small mt-1">{form.errors.message}</div>}
                        </div>
                        <div className="form-group mb-3">
                            <label className="form--label">Attachments</label>
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
                        <div className="d-flex gap-2 flex-wrap">
                            <button type="submit" className="btn btn--base" disabled={form.processing}>
                                {form.processing ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                            <a href={indexUrl} className="btn btn-outline--dark">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
