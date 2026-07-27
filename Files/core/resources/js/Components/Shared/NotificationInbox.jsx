import { useState } from 'react';
import Pagination from '@/Components/Shared/Pagination';

function formatType(type) {
    if (!type) return 'Notification';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NotificationInbox({ logs }) {
    const [active, setActive] = useState(null);

    const items = logs?.data ?? [];

    return (
        <>
            <div className="dashboard-card">
                <div className="dashboard-card__header">
                    <h6 className="dashboard-card__title mb-0">Notifications</h6>
                </div>
                <div className="dashboard-card__body p-0">
                    <div className="table-responsive notification-inbox-table">
                        <table className="table table--responsive--md mb-0">
                            <thead>
                                <tr>
                                    <th>Sent</th>
                                    <th>Channel</th>
                                    <th>Subject</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted py-4">
                                            No notifications yet. Activity such as shortlisted quotes, messages, and disputes will appear here.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((log) => (
                                        <tr key={log.id}>
                                            <td>
                                                {log.created_at}
                                                <br />
                                                <span className="text-muted small">{log.created_at_human}</span>
                                            </td>
                                            <td>
                                                <span className="fw-bold">{formatType(log.notification_type)}</span>
                                                <br />
                                                <span className="text-muted small">via {log.sender}</span>
                                            </td>
                                            <td>{log.subject || 'N/A'}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn--base btn-sm"
                                                    onClick={() => setActive(log)}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {logs?.links?.length > 3 && (
                    <div className="dashboard-card__footer">
                        <Pagination links={logs.links} />
                    </div>
                )}
            </div>

            {active && (
                <div className="modal custom--modal show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Notification Details</h5>
                                <button type="button" className="close" aria-label="Close" onClick={() => setActive(null)}>
                                    <i className="las la-times" />
                                </button>
                            </div>
                            <div className="modal-body">
                                <h6 className="text-center mb-3">To: {active.sent_to}</h6>
                                {active.image && (
                                    <img src={active.image} className="w-100 mb-2" alt="" />
                                )}
                                <div className="notification-message" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {active.message || 'No message'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
