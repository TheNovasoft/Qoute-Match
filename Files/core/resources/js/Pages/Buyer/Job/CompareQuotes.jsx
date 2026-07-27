import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import StructuredReviewScores from '@/Components/Shared/StructuredReviewScores';
import VerificationBadges from '@/Components/Shared/VerificationBadges';

function CompareMetricBar({ label, value, percent, tone = 'base', hint }) {
    const safePercent = Math.max(4, Math.min(100, percent || 0));

    return (
        <div className="compare-metric-bar">
            <div className="compare-metric-bar__head">
                <span className="compare-metric-bar__label">{label}</span>
                <span className="compare-metric-bar__value">{value}</span>
            </div>
            <div className="compare-metric-bar__track">
                <div
                    className={`compare-metric-bar__fill compare-metric-bar__fill--${tone}`}
                    style={{ width: `${safePercent}%` }}
                />
            </div>
            {hint && <small className="compare-metric-bar__hint text-muted">{hint}</small>}
        </div>
    );
}

function PriceComparisonChart({ bids, job, stats }) {
    if (!bids.length) return null;

    const amounts = bids.map((bid) => bid.amountRaw || 0);
    const budget = job.budgetRaw || 0;
    const maxScale = Math.max(...amounts, budget, 1);

    return (
        <div className="card custom--card mb-4 compare-quotes-chart">
            <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h6 className="mb-0">Visual comparison</h6>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                        {stats?.lowestPrice && <span>Lowest: <strong className="text--base">{stats.lowestPrice}</strong></span>}
                        {stats?.highestPrice && bids.length > 1 && <span>Highest: <strong>{stats.highestPrice}</strong></span>}
                        {stats?.averagePrice && bids.length > 1 && <span>Average: <strong>{stats.averagePrice}</strong></span>}
                        {job.budget && <span>Your budget: <strong>{job.budget}</strong></span>}
                    </div>
                </div>

                {bids.map((bid) => {
                    const pricePercent = ((bid.amountRaw || 0) / maxScale) * 100;
                    const vsBudget = budget > 0
                        ? `${bid.amountRaw <= budget ? 'Under' : 'Over'} budget by ${Math.abs(bid.amountRaw - budget).toFixed(0)}`
                        : null;

                    return (
                        <div className="compare-quotes-chart__row" key={bid.id}>
                            <div className="compare-quotes-chart__provider">
                                <img src={bid.provider.image} alt="" className="rounded-circle" width="36" height="36" />
                                <div>
                                    <strong>{bid.provider.name}</strong>
                                    {bid.isLowestPrice && <span className="badge bg-success ms-2">Best price</span>}
                                </div>
                            </div>
                            <CompareMetricBar
                                label="Quote price"
                                value={bid.amount}
                                percent={pricePercent}
                                tone={bid.isLowestPrice ? 'success' : 'base'}
                                hint={vsBudget}
                            />
                            <CompareMetricBar
                                label="Provider rating"
                                value={`${bid.provider.rating ?? 0} / 5 (${bid.provider.reviewsCount ?? 0} reviews)`}
                                percent={((bid.provider.rating ?? 0) / 5) * 100}
                                tone="primary"
                            />
                        </div>
                    );
                })}

                {bids.length === 1 && (
                    <p className="text-muted small mb-0 mt-3">
                        Add more provider quotes to see side-by-side price bars and a full comparison table.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function CompareQuotes({ pageTitle, job, bids, filters, stats, hireRequirements }) {
    const { routes } = usePage().props;
    const [localFilters, setLocalFilters] = useState(filters || {});
    const [revisionBidId, setRevisionBidId] = useState(null);
    const { data: revisionData, setData: setRevisionData, post: postRevision, processing: revisionProcessing, reset: resetRevision, errors: revisionErrors } = useForm({
        note: '',
    });

    const comparisonRows = useMemo(() => {
        const labels = new Set();
        bids.forEach((bid) => bid.quoteFields?.forEach((field) => labels.add(field.name)));
        return [...labels];
    }, [bids]);

    const hasSummedQuotes = useMemo(
        () => bids.some((bid) => bid.quoteBreakdown?.isSummedTotal),
        [bids],
    );

    const costLineLabels = useMemo(() => {
        const labels = new Set();
        bids.forEach((bid) => {
            bid.quoteBreakdown?.costLines?.forEach((line) => labels.add(line.name));
        });
        return [...labels];
    }, [bids]);

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(`${routes.buyerJobBids}/${job.id}`, localFilters, { preserveState: true });
    };

    const toggleShortlist = (bidId) => {
        router.post(`${routes.buyerJobBidsShortlist}/${bidId}/shortlist`, {}, { preserveScroll: true });
    };

    const acceptQuote = (bid) => {
        if (hireRequirements?.escrowEnabled && bid.shortfallRaw > 0) {
            window.alert(`Insufficient balance. Deposit at least ${bid.shortfall} to accept this quote.`);
            return;
        }
        if (!window.confirm('Accept this quote? Other pending quotes will be rejected.')) return;
        router.post(`${routes.buyerJobHire}/${bid.id}`, {}, { preserveScroll: true });
    };

    const rejectQuote = (bidId) => {
        if (!window.confirm('Reject this quote?')) return;
        router.post(`${routes.buyerJobBidsReject}/${bidId}/reject`, {}, { preserveScroll: true });
    };

    const openRevision = (bidId) => {
        setRevisionBidId(bidId);
        resetRevision();
    };

    const submitRevision = (event) => {
        event.preventDefault();
        postRevision(`${routes.buyerJobBidsRevision}/${revisionBidId}/revision`, {
            preserveScroll: true,
            onSuccess: () => {
                setRevisionBidId(null);
                resetRevision();
            },
        });
    };

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            <div className="buyer-panel-content">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                    <div>
                        <h4 className="mb-1">{job.title}</h4>
                        <p className="text-muted mb-0">
                            {job.category} {job.subcategory ? `› ${job.subcategory}` : ''}
                        </p>
                    </div>
                    <Link href={job.viewUrl} className="btn btn-outline--base btn-sm">
                        View Request
                    </Link>
                </div>

                {hireRequirements?.escrowEnabled && (
                    <div className="alert alert-warning mb-4">
                        Accepting a quote requires your wallet balance to cover the quote amount (escrow is enabled).
                        Your balance: <strong>{hireRequirements.buyerBalance}</strong>.
                        {' '}
                        <Link href={routes.buyerDeposit ?? '/customer/deposit'} className="alert-link">Deposit funds</Link>
                    </div>
                )}

                {stats && (
                    <div className="row g-3 mb-4 compare-quotes-stats">
                        <div className="col-md-4">
                            <div className="card custom--card h-100">
                                <div className="card-body">
                                    <small className="text-muted">Quotes received</small>
                                    <h4 className="mb-0">{stats.total}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card custom--card h-100">
                                <div className="card-body">
                                    <small className="text-muted">Shortlisted</small>
                                    <h4 className="mb-0">{stats.shortlisted}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card custom--card h-100">
                                <div className="card-body">
                                    <small className="text-muted">Lowest price</small>
                                    <h4 className="mb-0 text--base">{stats.lowestPrice ?? '—'}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {job.requestSummary?.length > 0 && (
                    <div className="card custom--card mb-4">
                        <div className="card-body">
                            <h6 className="mb-3">Request Summary</h6>
                            <div className="row gy-2">
                                {job.requestSummary.map((item) => (
                                    <div className="col-md-4" key={item.name}>
                                        <small className="text-muted d-block">{item.name}</small>
                                        {item.isFile ? (
                                            <a href={item.value} target="_blank" rel="noreferrer">Download</a>
                                        ) : (
                                            <span>{item.value}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <form className="card custom--card mb-4 compare-quotes-filters" onSubmit={applyFilters}>
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3 col-sm-6">
                                <label className="form--label">Sort</label>
                                <select
                                    className="form-select form--control"
                                    value={localFilters.sort || 'price_asc'}
                                    onChange={(e) => setLocalFilters({ ...localFilters, sort: e.target.value })}
                                >
                                    <option value="price_asc">Lowest price</option>
                                    <option value="price_desc">Highest price</option>
                                    <option value="rating">Highest rating</option>
                                    <option value="availability">Fastest availability</option>
                                    <option value="newest">Newest</option>
                                </select>
                            </div>
                            <div className="col-md-2 col-sm-6">
                                <label className="form--label">Min price</label>
                                <input
                                    type="number"
                                    className="form-control form--control"
                                    value={localFilters.min_price || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, min_price: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 col-sm-6">
                                <label className="form--label">Max price</label>
                                <input
                                    type="number"
                                    className="form-control form--control"
                                    value={localFilters.max_price || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, max_price: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 col-sm-6">
                                <button type="submit" className="btn btn--base w-100">Apply</button>
                            </div>
                        </div>
                        <div className="row g-3 mt-1">
                            <div className="col-auto">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.verified}
                                        onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Verified only</span>
                                </label>
                            </div>
                            <div className="col-auto">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.insured}
                                        onChange={(e) => setLocalFilters({ ...localFilters, insured: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Insured only</span>
                                </label>
                            </div>
                            <div className="col-auto">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.company}
                                        onChange={(e) => setLocalFilters({ ...localFilters, company: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Company verified</span>
                                </label>
                            </div>
                            <div className="col-auto">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.licence}
                                        onChange={(e) => setLocalFilters({ ...localFilters, licence: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Trade licence</span>
                                </label>
                            </div>
                            <div className="col-auto">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.shortlisted}
                                        onChange={(e) => setLocalFilters({ ...localFilters, shortlisted: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Shortlisted</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </form>

                {!bids.length && (
                    <div className="alert alert-info">No quotes received yet for this request.</div>
                )}

                {bids.length > 0 && (
                    <PriceComparisonChart bids={bids} job={job} stats={stats} />
                )}

                <div className="row gy-4 mb-4">
                    {bids.map((bid) => (
                        <div className="col-xl-4 col-md-6" key={bid.id}>
                            <div className={`card custom--card h-100 compare-quote-card ${bid.isShortlisted ? 'is-shortlisted' : ''} ${bid.isLowestPrice ? 'is-lowest' : ''}`}>
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3 mb-0">
                                        <img src={bid.provider.image} alt="" className="rounded-circle" width="48" height="48" />
                                        <div className="flex-grow-1 min-w-0">
                                            <h6 className="mb-0">
                                                <Link href={bid.provider.profileUrl}>{bid.provider.name}</Link>
                                                <VerificationBadges badges={bid.provider.verificationBadges} className="ms-1" />
                                            </h6>
                                            <small className="text-muted d-block mb-1">
                                                {(bid.provider.rating ?? 0)} ★ ({bid.provider.reviewsCount ?? 0} reviews)
                                            </small>
                                            <div className="compare-metric-bar__track compare-metric-bar__track--sm">
                                                <div
                                                    className="compare-metric-bar__fill compare-metric-bar__fill--primary"
                                                    style={{ width: `${Math.max(4, ((bid.provider.rating ?? 0) / 5) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {bid.provider.dimensionAverages?.some((item) => item.average > 0) && (
                                        <StructuredReviewScores
                                            scores={bid.provider.dimensionAverages}
                                            compact
                                            className="mb-3"
                                        />
                                    )}
                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                        {bid.isLowestPrice && <span className="badge bg-success">Best price</span>}
                                        {bid.isShortlisted && <span className="badge bg-warning text-dark">Shortlisted</span>}
                                        {bid.revisionRequested && <span className="badge bg-info">Revision requested</span>}
                                    </div>
                                    <h4 className="text--base mb-1">{bid.amount}</h4>
                                    {hireRequirements?.escrowEnabled && bid.shortfallRaw > 0 && (
                                        <p className="small text-warning mb-2">
                                            Deposit at least <strong>{bid.shortfall}</strong> to accept
                                        </p>
                                    )}
                                    <div className="compare-metric-bar mb-3">
                                        <div className="compare-metric-bar__track compare-metric-bar__track--sm">
                                            <div
                                                className={`compare-metric-bar__fill compare-metric-bar__fill--${bid.isLowestPrice ? 'success' : 'base'}`}
                                                style={{
                                                    width: `${Math.max(4, ((bid.amountRaw || 0) / Math.max(...bids.map((item) => item.amountRaw || 0), job.budgetRaw || 0, 1)) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <p className="mb-2"><strong>Timeline:</strong> {bid.estimatedTime}</p>
                                    <p className="mb-2"><strong>Status:</strong> {bid.statusLabel}</p>
                                    {bid.quoteBreakdown?.isSummedTotal && bid.quoteBreakdown.costLines?.length > 0 && (
                                        <div className="mb-2 small">
                                            <strong>Cost breakdown:</strong>
                                            <ul className="mb-0 ps-3">
                                                {bid.quoteBreakdown.costLines.map((line) => (
                                                    <li key={`${bid.id}-${line.name}`}>
                                                        {line.name}: {line.valueFormatted}
                                                    </li>
                                                ))}
                                            </ul>
                                            <span className="text--base fw-semibold">
                                                Total: {bid.quoteBreakdown.computedTotalFormatted}
                                            </span>
                                        </div>
                                    )}
                                    {bid.quoteFields?.slice(0, 4).map((field) => (
                                        <p className="mb-1 small" key={`${bid.id}-${field.name}`}>
                                            <strong>{field.name}:</strong>{' '}
                                            {field.isFile ? <a href={field.value} target="_blank" rel="noreferrer">File</a> : field.value}
                                        </p>
                                    ))}
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                        {bid.canMessage && (
                                            <Link href={bid.messageUrl} className="btn btn-sm btn-outline--base">
                                                Message
                                            </Link>
                                        )}
                                        <button type="button" className="btn btn-sm btn-outline--base" onClick={() => toggleShortlist(bid.id)}>
                                            {bid.isShortlisted ? 'Unshortlist' : 'Shortlist'}
                                        </button>
                                        {bid.canRequestRevision && (
                                            <button type="button" className="btn btn-sm btn-outline--secondary" onClick={() => openRevision(bid.id)}>
                                                Request revision
                                            </button>
                                        )}
                                        {bid.canAccept && (
                                            <>
                                                <button type="button" className="btn btn-sm btn--base" onClick={() => acceptQuote(bid)}>
                                                    Accept
                                                </button>
                                                <button type="button" className="btn btn-sm btn-outline--danger" onClick={() => rejectQuote(bid.id)}>
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {bids.length > 0 && comparisonRows.length > 0 && (
                    <div className="card custom--card">
                        <div className="card-body table-responsive">
                            <h6 className="mb-3">{bids.length > 1 ? 'Side-by-Side Comparison' : 'Quote Breakdown'}</h6>
                            <table className="table table-bordered compare-quotes-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        {bids.map((bid) => (
                                            <th key={bid.id}>{bid.provider.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Total Price</td>
                                        {bids.map((bid) => (
                                            <td key={bid.id} className={bid.isLowestPrice ? 'compare-quotes-table__best' : ''}>
                                                {bid.amount}
                                                {bid.quoteBreakdown?.isSummedTotal && (
                                                    <small className="d-block text-muted">Sum of cost lines</small>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    {hasSummedQuotes && costLineLabels.map((label) => (
                                        <tr key={`cost-${label}`}>
                                            <td>{label}</td>
                                            {bids.map((bid) => {
                                                const line = bid.quoteBreakdown?.costLines?.find((item) => item.name === label);
                                                return (
                                                    <td key={`${bid.id}-${label}`}>
                                                        {line?.valueFormatted || '—'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    <tr>
                                        <td>Timeline</td>
                                        {bids.map((bid) => (
                                            <td key={bid.id}>{bid.estimatedTime}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Rating</td>
                                        {bids.map((bid) => (
                                            <td key={bid.id}>{bid.provider.rating} ({bid.provider.reviewsCount})</td>
                                        ))}
                                    </tr>
                                    {comparisonRows.map((label) => (
                                        <tr key={label}>
                                            <td>{label}</td>
                                            {bids.map((bid) => {
                                                const field = bid.quoteFields?.find((item) => item.name === label);
                                                return (
                                                    <td key={`${bid.id}-${label}`}>
                                                        {field?.isFile ? (
                                                            <a href={field.value} target="_blank" rel="noreferrer">Download</a>
                                                        ) : (
                                                            field?.value || '—'
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {revisionBidId && (
                <div className="modal custom--modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={submitRevision}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Request quote revision</h5>
                                    <button type="button" className="btn-close" onClick={() => setRevisionBidId(null)} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <p className="text-muted small">
                                        Tell the provider what to change. Contact details are not shared through chat until you accept a quote.
                                    </p>
                                    <textarea
                                        className="form-control form--control"
                                        rows={5}
                                        value={revisionData.note}
                                        onChange={(e) => setRevisionData('note', e.target.value)}
                                        placeholder="Please revise labour cost and include scaffolding in inclusions..."
                                    />
                                    {revisionErrors.note && <div className="text-danger small mt-2">{revisionErrors.note}</div>}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn--dark btn-sm" onClick={() => setRevisionBidId(null)}>Cancel</button>
                                    <button type="submit" className="btn btn--base btn-sm" disabled={revisionProcessing}>
                                        Send revision request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </BuyerMasterLayout>
    );
}
