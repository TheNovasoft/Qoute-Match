import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';

const NOTIFICATION_TABS = [
    { key: 'channels', label: 'Channels', href: '/admin/notification/channels' },
    { key: 'global', label: 'Global Template', href: '/admin/notification/global/email' },
    { key: 'email', label: 'Email Setting', href: '/admin/notification/email/setting' },
    { key: 'sms', label: 'SMS Setting', href: '/admin/notification/sms/setting' },
    { key: 'push', label: 'Push Setting', href: '/admin/notification/notification/push/setting' },
    { key: 'whatsapp', label: 'WhatsApp Setting', href: '/admin/notification/whatsapp/setting' },
    { key: 'templates', label: 'Notification Templates', href: '/admin/notification/templates' },
];

export default function Channels({ pageTitle, channels, updateUrl, cleanupUrl }) {
    const initial = {};
    (channels ?? []).forEach((ch) => {
        initial[ch.key] = ch.enabled ? '1' : '0';
    });

    const form = useForm(initial);
    const cleanupForm = useForm({});

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={NOTIFICATION_TABS} active="channels" className="mb-4" />

            <div className="card bl--5 border--primary mb-4">
                <div className="card-body">
                    <p className="mb-0 text--primary">
                        Enable or disable each notification channel here. Use Manage links to edit templates and gateway settings.
                    </p>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(updateUrl);
                }}
            >
                <div className="row gy-4">
                    {(channels ?? []).map((channel) => (
                        <div className="col-xxl-4 col-md-6" key={channel.key}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                        <div>
                                            <h5 className="mb-1">
                                                <i className={`${channel.icon} me-1`} />
                                                {channel.title}
                                                {channel.badge ? (
                                                    <span className="badge badge--warning ms-1">{channel.badge}</span>
                                                ) : null}
                                            </h5>
                                            <p className="text-muted mb-0 small">{channel.description}</p>
                                        </div>
                                        <div className="form-check form-switch mb-0">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id={`channel-${channel.key}`}
                                                checked={form.data[channel.key] === '1'}
                                                onChange={(e) => form.setData(channel.key, e.target.checked ? '1' : '0')}
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {(channel.links ?? []).map((link) => (
                                            <a
                                                key={link.url}
                                                href={link.url}
                                                className="btn btn-sm btn-outline--primary"
                                                data-inertia="false"
                                            >
                                                {link.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="row mt-4">
                    <div className="col-12">
                        <button type="submit" className="btn btn--primary w-100 h-45" disabled={form.processing}>
                            Save Channel Settings
                        </button>
                    </div>
                </div>
            </form>

            <div className="row mt-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 className="mb-1">Clean old notification messages</h6>
                                <p className="mb-0 text-muted small">
                                    Removes leaked CSS/HTML from older SMS, in-app, push and WhatsApp notification logs.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn--dark"
                                disabled={cleanupForm.processing}
                                onClick={() => {
                                    if (window.confirm('Clean notification logs now?')) {
                                        cleanupForm.post(cleanupUrl);
                                    }
                                }}
                            >
                                Clean Existing Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
