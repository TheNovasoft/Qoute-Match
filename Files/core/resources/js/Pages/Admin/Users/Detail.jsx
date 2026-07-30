import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, user }) {
    const approveForm = useForm({});
    const creditsForm = useForm({ credits: '', note: '' });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={user.indexUrl} />
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{user.fullname}</h5>
                            <span className={user.kycStatus.class}>{user.kycStatus.label}</span>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3">
                                <div className="col-md-6"><span className="text-muted d-block">Username</span><strong>@{user.username}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Email</span><strong>{user.email}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Mobile</span><strong>{user.mobile ?? '—'}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Country</span><strong>{user.country ?? '—'}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Balance</span><strong>{user.balance}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Lead Credits</span><strong>{user.leadCredits}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Joined</span><strong>{user.joinedAt}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="row gy-3">
                        <div className="col-md-4">
                            <div className="card shadow-sm"><div className="card-body text-center">
                                <div className="text-muted small">Withdrawals</div>
                                <strong>{user.stats.withdrawals}</strong>
                            </div></div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm"><div className="card-body text-center">
                                <div className="text-muted small">Transactions</div>
                                <strong>{user.stats.transactions}</strong>
                            </div></div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm"><div className="card-body text-center">
                                <div className="text-muted small">Quotes</div>
                                <strong>{user.stats.bids}</strong>
                            </div></div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Verification Badges</h6>
                            {user.pendingVerifications > 0 && (
                                <span className="badge badge--warning">{user.pendingVerifications} pending</span>
                            )}
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush mb-3">
                                {(user.verificationSummary ?? []).map((item) => (
                                    <li key={item.key} className="list-group-item d-flex justify-content-between align-items-start px-0">
                                        <div>
                                            <strong className="d-block">{item.title}</strong>
                                            <small className="text-muted">{item.text}</small>
                                        </div>
                                        <span className={`badge ${item.verified ? 'badge--success' : 'badge--warning'}`}>
                                            {item.verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <a href={user.actions.verificationsUrl} className="btn btn-outline--primary btn-sm w-100">
                                Review badge submissions
                            </a>
                        </div>
                    </div>

                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white"><h6 className="mb-0">Actions</h6></div>
                        <div className="card-body d-grid gap-2">
                            {user.actions.approveProviderUrl && (
                                <button type="button" className="btn btn--success btn-sm" disabled={approveForm.processing}
                                    onClick={() => { if (window.confirm('Approve this provider?')) approveForm.post(user.actions.approveProviderUrl); }}>
                                    Approve Provider
                                </button>
                            )}
                            <a href={user.actions.kycUrl} className="btn btn-outline--dark btn-sm">KYC Details</a>
                            <a href={user.actions.reviewsUrl} className="btn btn-outline--primary btn-sm">Reviews</a>
                        </div>
                    </div>

                    {user.actions.grantCreditsUrl && (
                        <div className="card shadow-sm">
                            <div className="card-header bg-white"><h6 className="mb-0">Grant Lead Credits</h6></div>
                            <div className="card-body">
                                <form onSubmit={(e) => { e.preventDefault(); creditsForm.post(user.actions.grantCreditsUrl); }}>
                                    <div className="form-group mb-3">
                                        <label>Credits</label>
                                        <input type="number" className="form-control" value={creditsForm.data.credits}
                                            onChange={(e) => creditsForm.setData('credits', e.target.value)} required />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Note</label>
                                        <input className="form-control" value={creditsForm.data.note}
                                            onChange={(e) => creditsForm.setData('note', e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn--primary btn-sm w-100" disabled={creditsForm.processing}>Grant</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
