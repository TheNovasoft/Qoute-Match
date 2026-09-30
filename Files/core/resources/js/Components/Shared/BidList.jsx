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
        <div className="card shadow-sm dashboard-list-card">
            <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                    <h5 className="card-title mb-1">My quotes</h5>
                    <p className="text-muted mb-0 small">Quotes you sent to customers. To send a new one, find a job first.</p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <form className="table-search" onSubmit={submitSearch}>
                        <input
                            className="form-control form--control"
                            type="search"
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            placeholder="Search quotes..."
                        />
                        <button className="table-search-text" type="submit" aria-label="Search">
                            <i className="las la-search" />
                        </button>
                    </form>
                    <Link href="/freelance-jobs" className="btn btn--base">
                        <i className="las la-search" /> Find jobs
                    </Link>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table--light mb-0">
                    <thead>
                        <tr>
                            <th>Job</th>
                            <th>Customer</th>
                            <th>Your price</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-5">
                                    <p className="text-muted mb-3">No quotes yet.</p>
                                    <Link href="/freelance-jobs" className="btn btn--base">
                                        <i className="las la-search" /> Find jobs to quote
                                    </Link>
                                </td>
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
                                        {bid.estimatedTime ? (
                                            <span className="small d-block text-muted">Time: {bid.estimatedTime}</span>
                                        ) : null}
                                    </td>
                                    <td data-label="Customer">
                                        <div>
                                            {bid.buyer.fullname}
                                            <span className="small d-block text-muted">@{bid.buyer.username}</span>
                                        </div>
                                    </td>
                                    <td data-label="Your price">
                                        <div className="bid-budget-cell">
                                            <span className="bid-budget-cell__amount">{bid.bidAmount}</span>
                                            <span className="bid-budget-cell__type text--primary">
                                                {bid.customBudget ? 'Custom' : 'Fixed'}
                                            </span>
                                            <span className="bid-budget-cell__request text-muted">
                                                Customer budget: {bid.jobBudget}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Status">
                                        <div className="bid-status-cell">
                                            <StatusBadge status={bid.status} />
                                            {bid.requestUpdated && (
                                                <span className="badge badge--info">Updated</span>
                                            )}
                                        </div>
                                    </td>
                                    <td data-label="Action" className="bid-actions-cell">
                                        <div className="bid-actions-wrap d-flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline--primary"
                                                onClick={() => setQuoteModal(bid)}
                                            >
                                                View
                                            </button>
                                            {bid.canEdit && (
                                                <Link href={bid.editUrl} className="btn btn-sm btn--base">
                                                    Edit
                                                </Link>
                                            )}
                                            {bid.projectUrl && (
                                                <Link href={bid.projectUrl} className="btn btn-sm btn-outline--primary">Open job</Link>
                                            )}
                                            {bid.withdrawUrl && bid.status?.label === 'Pending' && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline--danger"
                                                    onClick={() => setWithdrawModal({
                                                        url: bid.withdrawUrl,
                                                        question: 'Withdraw this quote? The customer will no longer see it.',
                                                    })}
                                                >
                                                    Withdraw
                                                </button>
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
                <div className="card-footer">
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
                                <h5 className="modal-title">Withdraw quote?</h5>
                                <button type="button" className="close" onClick={() => setWithdrawModal(null)}>
                                    <i className="las la-times" />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>{withdrawModal.question}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn--danger" onClick={() => setWithdrawModal(null)}>No</button>
                                <button type="button" className="btn btn--base" onClick={confirmWithdraw}>Yes, withdraw</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
