import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, buyer }) {
    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={buyer.indexUrl} />
            </div>

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{buyer.fullname}</h5>
                            <span className={buyer.kycStatus.class}>{buyer.kycStatus.label}</span>
                        </div>
                        <div className="card-body">
                            <div className="row gy-3">
                                <div className="col-md-6"><span className="text-muted d-block">Username</span><strong>@{buyer.username}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Email</span><strong>{buyer.email}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Mobile</span><strong>{buyer.mobile ?? '—'}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Country</span><strong>{buyer.country ?? '—'}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Balance</span><strong>{buyer.balance}</strong></div>
                                <div className="col-md-6"><span className="text-muted d-block">Joined</span><strong>{buyer.joinedAt}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="row gy-3">
                        <div className="col-md-4">
                            <div className="card shadow-sm"><div className="card-body text-center">
                                <div className="text-muted small">Deposits</div>
                                <strong>{buyer.stats.deposits}</strong>
                            </div></div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm"><div className="card-body text-center">
                                <div className="text-muted small">Withdrawals</div>
                                <strong>{buyer.stats.withdrawals}</strong>
                            </div></div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm"><div className="card-body text-center">
                                <div className="text-muted small">Transactions</div>
                                <strong>{buyer.stats.transactions}</strong>
                            </div></div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white"><h6 className="mb-0">Actions</h6></div>
                        <div className="card-body d-grid gap-2">
                            {buyer.actions.loginUrl && (
                                <a href={buyer.actions.loginUrl} target="_blank" rel="noreferrer" className="btn btn-outline--primary btn-sm">
                                    Login as Buyer
                                </a>
                            )}
                            <a href={buyer.actions.kycUrl} className="btn btn-outline--dark btn-sm">KYC Details</a>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
