import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import ConfirmModal from '@/Components/Shared/ConfirmModal';
import ModalOverlay from '@/Components/Shared/ModalOverlay';
import StructuredReviewScores from '@/Components/Shared/StructuredReviewScores';
import VerificationBadges from '@/Components/Shared/VerificationBadges';

function formatProviderRating(rating, reviewsCount) {
    if (!reviewsCount) {
        return 'No reviews yet';
    }

    const value = Number(rating ?? 0);
    return `${value.toFixed(1)} / 5 (${reviewsCount} review${reviewsCount === 1 ? '' : 's'})`;
}

const FILTER_HELP = {
    sort: 'Recommended balances price, rating, and availability. Use Lowest price when cost matters most.',
    min_price: 'Only show quotes at or above this amount. Leave blank for no minimum.',
    max_price: 'Only show quotes at or below this amount. Leave blank for no maximum.',
    verified: 'Only show providers whose identity has been checked by our team.',
    insured: 'Only show providers with approved insurance documents on file.',
    company: 'Only show providers with a verified company registration.',
    licence: 'Only show providers with an approved trade or industry licence.',
    shortlisted: 'Show only quotes you saved to your favorites list.',
};

function FilterHint({ text }) {
    if (!text) return null;
    return <small className="text-muted d-block mt-1 compare-filter-hint">{text}</small>;
}

function filterValuesActive(f) {
    if (!f || typeof f !== 'object') {
        return false;
    }

    if (String(f.min_price ?? '').trim() !== '') {
        return true;
    }
    if (String(f.max_price ?? '').trim() !== '') {
        return true;
    }
    if (f.sort && f.sort !== 'recommended') {
        return true;
    }

    return ['verified', 'insured', 'company', 'licence', 'shortlisted'].some(
        (key) => Number(f[key]) === 1 || f[key] === true || f[key] === '1',
    );
}

function SingleQuoteWaitingBanner({ job, onShare }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (!job.publicUrl) return;
        try {
            await navigator.clipboard.writeText(job.publicUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2500);
        } catch {
            onShare?.(job.publicUrl);
        }
    };

    return (
        <div className="card custom--card mb-4 compare-single-quote-banner border-info">
            <div className="card-body">
                <div className="d-flex flex-wrap gap-3 align-items-start">
                    <div className="compare-single-quote-banner__icon text-info">
                        <i className="las la-hourglass-half fs-2" aria-hidden="true" />
                    </div>
                    <div className="flex-grow-1">
                        <h5 className="mb-2">You have 1 quote so far</h5>
                        <p className="text-muted mb-3">
                            Most jobs receive more quotes within <strong>24–48 hours</strong>. You can review this quote now,
                            message the provider, or wait for more options before deciding.
                        </p>
                        <p className="small mb-3">
                            <strong>Suggested next steps:</strong> Save to favorites → Message provider → Compare when more quotes arrive → Accept the best fit.
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                            <Link href={job.viewUrl} className="btn btn-sm btn-outline--base">
                                View job details
                            </Link>
                            {job.publicUrl && (
                                <button type="button" className="btn btn-sm btn-outline--base" onClick={handleShare}>
                                    {copied ? 'Link copied' : 'Copy share link'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
                                value={formatProviderRating(bid.provider.rating, bid.provider.reviewsCount)}
                                percent={((bid.provider.rating ?? 0) / 5) * 100}
                                tone="primary"
                            />
                        </div>
                    );
                })}

                {bids.length === 1 && (
                    <p className="text-muted small mb-0 mt-3">
                        When more providers respond, price bars and the comparison table will update automatically.
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
    const [confirmState, setConfirmState] = useState(null);
    const [acceptProcessing, setAcceptProcessing] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);

    useEffect(() => {
        setLocalFilters(filters || {});
    }, [filters]);

    const sortLabels = {
        recommended: 'Recommended',
        price_asc: 'Lowest price',
        price_desc: 'Highest price',
        rating: 'Highest rating',
        availability: 'Fastest availability',
        newest: 'Newest',
    };

    const navigateWithFilters = (nextFilters) => {
        router.get(`${routes.buyerJobBids}/${job.id}`, nextFilters, {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    };
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

    const hasActiveFilters = useMemo(
        () => filterValuesActive(filters) || filterValuesActive(localFilters),
        [filters, localFilters],
    );

    const applyFilters = (event) => {
        if (event) event.preventDefault();
        navigateWithFilters(localFilters);
    };

    const updateSort = (sort) => {
        const next = { ...localFilters, sort };
        setLocalFilters(next);
        navigateWithFilters(next);
    };

    const clearFilters = () => {
        const reset = { sort: 'recommended' };
        setLocalFilters(reset);
        navigateWithFilters(reset);
    };

    const toggleShortlist = (bidId) => {
        router.post(`${routes.buyerJobBidsShortlist}/${bidId}/shortlist`, {}, { preserveScroll: true });
    };

    const openAcceptConfirm = (bid) => {
        if (hireRequirements?.escrowEnabled && bid.shortfallRaw > 0) {
            setConfirmState({
                type: 'deposit',
                bid,
                title: 'Add money to accept this quote',
                message: `Your wallet balance is too low. Deposit at least ${bid.shortfall} to accept this quote.`,
            });
            return;
        }

        setConfirmState({
            type: 'accept',
            bid,
            title: 'Accept this quote?',
            message: 'The provider will be hired for this job. All other pending quotes will be rejected.',
        });
    };

    const confirmAccept = () => {
        const bid = confirmState?.bid;
        if (!bid) return;

        setAcceptProcessing(true);
        const hireUrl = routes.buyerJobHire || '/customer/job/post/hire-talent';
        router.post(`${hireUrl}/${bid.id}`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setAcceptProcessing(false);
                setConfirmState(null);
            },
            onError: (errors) => {
                setAcceptProcessing(false);
                const message = errors?.balance || errors?.error || Object.values(errors || {})[0];
                setConfirmState({
                    type: 'error',
                    title: 'Unable to accept quote',
                    message: message || 'Something went wrong while hiring this provider.',
                });
            },
        });
    };

    const openRejectConfirm = (bidId) => {
        setConfirmState({
            type: 'reject',
            bidId,
            title: 'Reject this quote?',
            message: 'The provider will be notified. You can still accept other quotes on this job.',
        });
    };

    const confirmReject = () => {
        const bidId = confirmState?.bidId;
        if (!bidId || rejectProcessing) return;

        setRejectProcessing(true);
        router.post(`${routes.buyerJobBidsReject}/${bidId}/reject`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setRejectProcessing(false);
                setConfirmState(null);
            },
            onError: () => {
                setRejectProcessing(false);
            },
        });
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

    const depositUrl = routes.buyerDeposit ?? '/customer/deposit';

    return (
        <BuyerMasterLayout pageTitle={pageTitle} backUrl={job?.viewUrl}>
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

                {bids.length > 0 && (
                    <div className="alert alert-light border mb-4 compare-quotes-flow-tip">
                        <strong>Recommended flow:</strong> Save to favorites → Message provider → Accept the best quote.
                    </div>
                )}

                {hireRequirements?.escrowEnabled && (
                    <div className="alert alert-warning mb-4">
                        Accepting a quote requires your wallet balance to cover the quote amount (escrow is enabled).
                        Your balance: <strong>{hireRequirements.buyerBalance}</strong>.
                        {' '}
                        <Link href={depositUrl} className="alert-link">Add money</Link>
                    </div>
                )}

                {stats && (
                    <div className="row g-3 mb-4 compare-quotes-stats">
                        <div className="col-md-4">
                            <div className="card custom--card h-100">
                                <div className="card-body">
                                    <small className="text-muted">Active quotes</small>
                                    <h4 className="mb-0">{stats.total}</h4>
                                    {stats.total > 0 && stats.matching != null && stats.matching !== stats.total && (
                                        <small className="text--base d-block">
                                            Showing {stats.matching} matching your filters
                                        </small>
                                    )}
                                    {stats.rejected > 0 && (
                                        <small className="text-muted">{stats.rejected} rejected and hidden</small>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card custom--card h-100">
                                <div className="card-body">
                                    <small className="text-muted">Saved to favorites</small>
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
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 compare-quotes-filters__header">
                            <div>
                                <h6 className="mb-0">Filter & sort quotes</h6>
                                {localFilters.sort && (
                                    <small className="text-muted">
                                        Sorted by: <strong>{sortLabels[localFilters.sort] || localFilters.sort}</strong>
                                    </small>
                                )}
                                {hasActiveFilters && (
                                    <small className="text--base d-block mt-1">
                                        Filters are applied — use Clear filters to show all quotes again.
                                    </small>
                                )}
                            </div>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline--base compare-quotes-filters__clear flex-shrink-0"
                                    onClick={clearFilters}
                                >
                                    <i className="las la-times me-1" aria-hidden="true" />
                                    Clear filters
                                </button>
                            )}
                        </div>
                        <div className="row g-3 align-items-end">
                            <div className="col-12 col-md-6 col-lg-3">
                                <label className="form--label">Sort</label>
                                <select
                                    className="form-select form--control"
                                    value={localFilters.sort || 'recommended'}
                                    onChange={(e) => updateSort(e.target.value)}
                                >
                                    <option value="recommended">Recommended</option>
                                    <option value="price_asc">Lowest price</option>
                                    <option value="price_desc">Highest price</option>
                                    <option value="rating">Highest rating</option>
                                    <option value="availability">Fastest availability</option>
                                    <option value="newest">Newest</option>
                                </select>
                                <FilterHint text={FILTER_HELP.sort} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <label className="form--label">Min price</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control form--control"
                                    placeholder="No minimum"
                                    value={localFilters.min_price || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, min_price: e.target.value })}
                                />
                                <FilterHint text={FILTER_HELP.min_price} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <label className="form--label">Max price</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control form--control"
                                    placeholder="No maximum"
                                    value={localFilters.max_price || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, max_price: e.target.value })}
                                />
                                <FilterHint text={FILTER_HELP.max_price} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn--base w-100">Apply filters</button>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            className="btn btn-outline--base w-100 d-md-none"
                                            onClick={clearFilters}
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="row g-3 mt-2 compare-quotes-filters__checks">
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.verified}
                                        onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Verified only</span>
                                </label>
                                <FilterHint text={FILTER_HELP.verified} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.insured}
                                        onChange={(e) => setLocalFilters({ ...localFilters, insured: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Insured only</span>
                                </label>
                                <FilterHint text={FILTER_HELP.insured} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.company}
                                        onChange={(e) => setLocalFilters({ ...localFilters, company: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Company verified</span>
                                </label>
                                <FilterHint text={FILTER_HELP.company} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.licence}
                                        onChange={(e) => setLocalFilters({ ...localFilters, licence: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Trade licence</span>
                                </label>
                                <FilterHint text={FILTER_HELP.licence} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-check mb-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={!!localFilters.shortlisted}
                                        onChange={(e) => setLocalFilters({ ...localFilters, shortlisted: e.target.checked ? 1 : 0 })}
                                    />
                                    <span className="form-check-label">Saved to favorites</span>
                                </label>
                                <FilterHint text={FILTER_HELP.shortlisted} />
                            </div>
                        </div>
                    </div>
                </form>

                {!bids.length && stats?.total > 0 && hasActiveFilters && (
                    <div className="card custom--card mb-4 border-warning">
                        <div className="card-body text-center py-5">
                            <i className="las la-filter fs-1 text-warning mb-3 d-block" aria-hidden="true" />
                            <h5 className="mb-2">No quotes match your filters</h5>
                            <p className="text-muted mb-4">
                                You have <strong>{stats.total}</strong> active quote{stats.total === 1 ? '' : 's'}, but
                                none fit the current Min/Max price or checkbox filters. Clear filters or widen your price range.
                            </p>
                            <button type="button" className="btn btn--base btn-sm" onClick={clearFilters}>
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}

                {!bids.length && stats?.total === 0 && stats?.rejected > 0 && (
                    <div className="card custom--card mb-4">
                        <div className="card-body text-center py-5">
                            <i className="las la-user-times fs-1 text-muted mb-3 d-block" aria-hidden="true" />
                            <h5 className="mb-2">No active quotes</h5>
                            <p className="text-muted mb-4">
                                {stats.rejected} quote{stats.rejected === 1 ? ' was' : 's were'} rejected and hidden here.
                                Share your job link so providers can send new quotes, or wait for more responses.
                            </p>
                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                {job.publicUrl && (
                                    <button
                                        type="button"
                                        className="btn btn--base btn-sm"
                                        onClick={() => navigator.clipboard?.writeText(job.publicUrl)}
                                    >
                                        Copy share link
                                    </button>
                                )}
                                <Link href={job.viewUrl} className="btn btn-outline--base btn-sm">View job</Link>
                            </div>
                        </div>
                    </div>
                )}

                {!bids.length && stats?.total === 0 && !(stats?.rejected > 0) && (
                    <div className="card custom--card mb-4">
                        <div className="card-body text-center py-5">
                            <i className="las la-inbox fs-1 text-muted mb-3 d-block" aria-hidden="true" />
                            <h5 className="mb-2">No quotes yet</h5>
                            <p className="text-muted mb-4">
                                Providers are reviewing your job. Most requests receive the first quote within 24–48 hours.
                            </p>
                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                <Link href={job.viewUrl} className="btn btn-outline--base btn-sm">View job</Link>
                                {job.publicUrl && (
                                    <button
                                        type="button"
                                        className="btn btn--base btn-sm"
                                        onClick={() => navigator.clipboard?.writeText(job.publicUrl)}
                                    >
                                        Copy share link
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {bids.length === 1 && <SingleQuoteWaitingBanner job={job} />}

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
                                                {formatProviderRating(bid.provider.rating, bid.provider.reviewsCount)}
                                                {bid.provider.presenceLabel && (
                                                    <>
                                                        {' · '}
                                                        <span className={`provider-presence provider-presence--${bid.provider.presence || 'offline'}`}>
                                                            {bid.provider.presenceLabel}
                                                        </span>
                                                    </>
                                                )}
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
                                        {bid.isShortlisted && <span className="badge bg-warning text-dark">Saved</span>}
                                        {bid.revisionRequested && <span className="badge bg-info">Revision requested</span>}
                                        {bid.isExpired && <span className="badge bg-secondary">Expired</span>}
                                        {!bid.isExpired && bid.expiryLabel && (
                                            <span className="badge bg-light text-dark">{bid.expiryLabel}</span>
                                        )}
                                    </div>
                                    <h4 className="text--base mb-1">{bid.amount}</h4>
                                    {hireRequirements?.escrowEnabled && bid.canAccept && bid.shortfallRaw > 0 && (
                                        <p className="small text-warning mb-2">
                                            Add at least <strong>{bid.shortfall}</strong> to accept
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
                                            {bid.isShortlisted ? 'Remove favorite' : 'Save to favorites'}
                                        </button>
                                        {bid.canRequestRevision && (
                                            <button type="button" className="btn btn-sm btn-outline--secondary" onClick={() => openRevision(bid.id)}>
                                                Request revision
                                            </button>
                                        )}
                                        {bid.canAccept && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn--base"
                                                    onClick={() => openAcceptConfirm(bid)}
                                                >
                                                    {hireRequirements?.escrowEnabled && bid.shortfallRaw > 0 ? 'Add money to accept' : 'Accept quote'}
                                                </button>
                                                <button type="button" className="btn btn-sm btn-outline--danger" onClick={() => openRejectConfirm(bid.id)}>
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
                            {bids.length === 1 && (
                                <p className="text-muted small">
                                    This table shows the full details for your first quote. More columns will appear when additional providers respond.
                                </p>
                            )}
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
                                        <td>Quote valid until</td>
                                        {bids.map((bid) => (
                                            <td key={bid.id}>{bid.expiryLabel || bid.expiresAt || '—'}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>Rating</td>
                                        {bids.map((bid) => (
                                            <td key={bid.id}>{formatProviderRating(bid.provider.rating, bid.provider.reviewsCount)}</td>
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

            <ConfirmModal
                show={confirmState?.type === 'accept'}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmLabel="Accept quote"
                onConfirm={confirmAccept}
                onCancel={() => setConfirmState(null)}
                processing={acceptProcessing}
            />

            <ConfirmModal
                show={confirmState?.type === 'reject'}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmLabel="Reject quote"
                confirmClass="btn-outline--danger"
                onConfirm={confirmReject}
                onCancel={() => setConfirmState(null)}
                processing={rejectProcessing}
            />

            <ConfirmModal
                show={confirmState?.type === 'deposit'}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmLabel="Add money"
                onConfirm={() => {
                    router.visit(depositUrl);
                    setConfirmState(null);
                }}
                onCancel={() => setConfirmState(null)}
            />

            <ConfirmModal
                show={confirmState?.type === 'error'}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmLabel="OK"
                onConfirm={() => setConfirmState(null)}
                onCancel={() => setConfirmState(null)}
            />

            {revisionBidId && (
                <ModalOverlay show onClose={() => setRevisionBidId(null)}>
                    <div className="modal-content">
                        <form onSubmit={submitRevision}>
                            <div className="modal-header">
                                <h5 className="modal-title">Request quote revision</h5>
                                <button type="button" className="btn-close" onClick={() => setRevisionBidId(null)} aria-label="Close" />
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
                </ModalOverlay>
            )}
        </BuyerMasterLayout>
    );
}
