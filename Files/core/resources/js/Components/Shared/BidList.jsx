import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Pagination from '@/Components/Shared/Pagination';
import StatusBadge from '@/Components/Shared/StatusBadge';

export default function BidList({ bids, indexUrl }) {
    const rows = bids?.data ?? [];
    const [quoteModal, setQuoteModal] = useState(null);
    const [withdrawModal, setWithdrawModal] = useState(null);
    const { data, setData } = useForm({ search: '' });

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(indexUrl, { search: data.search }, { preserveState: true });
    };

    const confirmWithdraw = () => {
        if (!withdrawModal) return;
        router.post(withdrawModal.url, {}, { onFinish: () => setWithdrawModal(null) });
    };

    return (
        <div className="table-wrapper">
            <div className="table-wrapper-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div>
                    <h6 className="mb-1">Your submitted quotes</h6>
                    <p className="text-muted mb-0 small">To place a new bid, browse open customer requests first.</p>
                </div>
                <Link href="/jobs" className="btn btn--base">
                    <i className="las la-search" /> Browse Requests &amp; Bid
                </Link>
            </div>
            <div className="table-wrapper-header d-flex justify-content-end">
                <form className="table-search" onSubmit={submitSearch}>
                    <input
                        className="form-control form--control"
                        type="search"
                        value={data.search}
                        onChange={(e) => setData('search', e.target.value)}
                        placeholder="Search Here..."
                    />
                    <button className="table-search-text" type="submit">
                        <i className="las la-search" />
                    </button>
                </form>
            </div>
            <div className="dashboard-table">
                <table className="table table--responsive--md">
                    <thead>
                        <tr>
                            <th>Job</th>
                            <th>Buyer</th>
                            <th>Estimate Time</th>
                            <th>Budget</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted py-4">No quotes submitted yet.</td>
                            </tr>
                        ) : (
                            rows.map((bid) => (
                                <tr key={bid.id}>
                                    <td data-label="Job">
                                        {bid.jobUrl ? (
                                            <a className="clamping" href={bid.jobUrl} target="_blank" rel="noreferrer">{bid.jobTitle}</a>
                                        ) : (
                                            <span className="clamping">{bid.jobTitle}</span>
                                        )}
                                    </td>
                                    <td data-label="Buyer">
                                        <div>
                                            {bid.buyer.fullname}
                                            <span className="small d-block">
                                                <a href={bid.buyer.jobsUrl} target="_blank" rel="noreferrer">@{bid.buyer.username}</a>
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Estimate Time"><span className="clamping">{bid.estimatedTime}</span></td>
                                    <td data-label="Budget">
                                        <div className="bid-budget-cell">
                                            <span className="bid-budget-cell__amount">{bid.bidAmount}</span>
                                            <span className="bid-budget-cell__type text--primary">
                                                {bid.customBudget ? 'Customized' : 'Fixed'}
                                            </span>
                                            <span className="bid-budget-cell__request text-muted">
                                                Request budget: {bid.jobBudget}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Status">
                                        <div className="bid-status-cell">
                                            <StatusBadge status={bid.status} />
                                            {bid.requestUpdated && (
                                                <span className="badge badge--info">Request updated</span>
                                            )}
                                        </div>
                                    </td>
                                    <td data-label="Action" className="bid-actions-cell">
                                        <div className="bid-actions-wrap">
                                            <div className="bid-actions-primary">
                                                <button
                                                    type="button"
                                                    className="btn btn--dark btn-sm"
                                                    onClick={() => setQuoteModal(bid)}
                                                >
                                                    Quote
                                                </button>
                                                {bid.withdrawUrl && bid.status?.label === 'Pending' && (
                                                    <button
                                                        type="button"
                                                        className="btn btn--danger btn-sm"
                                                        onClick={() => setWithdrawModal({ url: bid.withdrawUrl, question: 'Are you sure to withdraw this job proposal / bid?' })}
                                                    >
                                                        Withdraw
                                                    </button>
                                                )}
                                            </div>
                                            {bid.canEdit && (
                                                <Link href={bid.editUrl} className="btn btn--base btn-sm">
                                                    <i className="las la-edit" /> Edit Bid
                                                </Link>
                                            )}
                                            {bid.projectUrl && (
                                                <Link href={bid.projectUrl} className="btn btn-outline--base btn-sm">Project</Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {bids?.links?.length > 3 && (
                <div className="table-wrapper-footer">
                    <Pagination links={bids.links} />
                </div>
            )}

            {quoteModal && (
                <div className="modal custom--modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{quoteModal.jobTitle}</h5>
                                <button type="button" className="close" onClick={() => setQuoteModal(null)}>
                                    <i className="las la-times" />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p><i className="las la-quote-left" /> {quoteModal.bidQuote} <i className="las la-quote-right" /></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {withdrawModal && (
                <div className="modal custom--modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmation Alert!</h5>
                                <button type="button" className="close" onClick={() => setWithdrawModal(null)}>
                                    <i className="las la-times" />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>{withdrawModal.question}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn--danger" onClick={() => setWithdrawModal(null)}>No</button>
                                <button type="button" className="btn btn--base" onClick={confirmWithdraw}>Yes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
