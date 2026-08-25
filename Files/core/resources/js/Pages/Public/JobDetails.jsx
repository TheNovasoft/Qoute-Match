import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import JobCard, { BidFreelancerCard, SimilarJobItem } from '@/Components/Jobs/JobCard';
import RequestFormFields from '@/Components/Jobs/RequestFormFields';
import { EmptyState } from '@/Components/Shared/Pagination';

const EXPLICIT_TOTAL_FIELD_NAMES = ['Total Price'];

export default function JobDetails({
    pageTitle,
    seo,
    job,
    customPageTitle,
    customSubPageTitle,
    toRoute,
    biddenFreelancers,
    totalBiddenFreelancers,
    similarJobs,
    totalSimilarJobs,
    topSkills,
    buyer,
    policies,
    bannerShape,
    bidState,
    quoteFields = [],
    existingBid = null,
}) {
    const { auth, template, routes } = usePage().props;
    const [freelancers, setFreelancers] = useState(biddenFreelancers || []);
    const [similarJobList, setSimilarJobList] = useState(similarJobs || []);
    const [freelancerOffset, setFreelancerOffset] = useState(5);
    const [similarOffset, setSimilarOffset] = useState(5);
    const [showBidModal, setShowBidModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [quoteStep, setQuoteStep] = useState(0);
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const [quoteValues, setQuoteValues] = useState({});

    const amountQuoteField = useMemo(
        () => quoteFields.find((field) => EXPLICIT_TOTAL_FIELD_NAMES.includes(field.name)),
        [quoteFields],
    );

    const costFields = useMemo(
        () => quoteFields.filter((field) => field.type === 'number'),
        [quoteFields],
    );

    // No explicit "Total Price" field but numeric cost line items exist (e.g. Freight):
    // the quote total is the sum of every cost field.
    const isSummedTotal = !amountQuoteField && costFields.length > 0;

    const summedTotal = useMemo(() => {
        if (!isSummedTotal) return 0;
        return costFields.reduce((total, field) => {
            const raw = parseFloat(quoteValues[field.label]);
            return total + (Number.isFinite(raw) ? raw : 0);
        }, 0);
    }, [isSummedTotal, costFields, quoteValues]);

    const showStandaloneBidAmount = job.customBudget && !amountQuoteField && !isSummedTotal;

    const priceStepFields = useMemo(() => {
        if (isSummedTotal) {
            return costFields;
        }
        if (amountQuoteField) {
            return [amountQuoteField];
        }
        return [];
    }, [isSummedTotal, costFields, amountQuoteField]);

    const detailsStepFields = useMemo(() => {
        const priceLabels = new Set(priceStepFields.map((field) => field.label));
        return quoteFields.filter((field) => !priceLabels.has(field.label));
    }, [quoteFields, priceStepFields]);

    const { data, setData, processing, reset, errors } = useForm({
        bid_amount: existingBid?.bid_amount ?? '',
        estimated_time: existingBid?.estimated_time ?? '',
        bid_quote: existingBid?.bid_quote ?? '',
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const wantsEdit = new URLSearchParams(window.location.search).get('edit') === '1';
        const canEdit = Boolean(bidState?.canEdit && existingBid);

        if (canEdit && wantsEdit) {
            setIsEditMode(true);
            setShowBidModal(true);
        }
    }, [bidState?.canEdit, existingBid]);

    useEffect(() => {
        const initial = {};
        quoteFields.forEach((field) => {
            if (field.value !== null && field.value !== undefined && field.value !== '') {
                initial[field.label] = field.value;
            }
        });

        if (Object.keys(initial).length) {
            setQuoteValues(initial);
        }
    }, [existingBid?.id, quoteFields]);

    useEffect(() => {
        if (!showBidModal) {
            setQuoteStep(0);
        }
    }, [showBidModal]);

    const quoteWizardSteps = ['Your price', 'Timeline', 'Proposal', 'Review'];
    const quotePriceLabel = isSummedTotal
        ? `${summedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${job.currencyText}`
        : (data.bid_amount || (amountQuoteField ? quoteValues[amountQuoteField.label] : '') || '—');

    const canAdvanceQuoteStep = () => {
        if (quoteStep === 0) {
            if (showStandaloneBidAmount) {
                return Boolean(String(data.bid_amount ?? '').trim());
            }
            if (isSummedTotal) {
                return summedTotal > 0;
            }
            if (amountQuoteField) {
                return Boolean(String(quoteValues[amountQuoteField.label] ?? '').trim());
            }
            return true;
        }
        if (quoteStep === 1) {
            return Boolean(String(data.estimated_time ?? '').trim());
        }
        if (quoteStep === 2) {
            if (quoteFields.length > 0) {
                return true;
            }
            return Boolean(String(data.bid_quote ?? '').trim());
        }
        return true;
    };

    const handleQuoteWizardSubmit = (event) => {
        if (quoteStep < quoteWizardSteps.length - 1) {
            event.preventDefault();
            if (canAdvanceQuoteStep()) {
                setQuoteStep((step) => step + 1);
            }
            return;
        }
        submitBid(event);
    };

    const loadMoreFreelancers = async () => {
        const response = await window.axios.get('/explore-get-similar-providers', {
            params: { job_id: job.id, offset: freelancerOffset, limit: 5 },
            headers: { Accept: 'application/json' },
        });
        const payload = response.data.data || response.data;
        setFreelancers((prev) => [...prev, ...(payload.freelancers || [])]);
        setFreelancerOffset(payload.next_offset || freelancerOffset);
    };

    const loadMoreSimilarJobs = async () => {
        const response = await window.axios.get('/explore-get-similar-jobs', {
            params: { job_skill_ids: job.skills.map((s) => s.id), offset: similarOffset, limit: 5 },
            headers: { Accept: 'application/json' },
        });
        const payload = response.data.data || response.data;
        setSimilarJobList((prev) => [...prev, ...(payload.jobs || [])]);
        setSimilarOffset(payload.next_offset || similarOffset);
    };

    const handleBidAmountChange = (value) => {
        setData('bid_amount', value);
        if (amountQuoteField) {
            setQuoteValues((prev) => ({ ...prev, [amountQuoteField.label]: value }));
        }
    };

    const handleQuoteFieldChange = (label, value) => {
        setQuoteValues((prev) => ({ ...prev, [label]: value }));
        if (amountQuoteField && label === amountQuoteField.label) {
            setData('bid_amount', value);
        }
    };

    const submitBid = (event) => {
        event.preventDefault();
        let resolvedAmount;
        if (isSummedTotal) {
            resolvedAmount = summedTotal;
        } else if (amountQuoteField) {
            resolvedAmount = quoteValues[amountQuoteField.label] ?? data.bid_amount;
        } else {
            resolvedAmount = data.bid_amount;
        }
        const payload = {
            bid_amount: resolvedAmount,
            estimated_time: data.estimated_time,
            bid_quote: data.bid_quote,
            ...quoteValues,
        };

        const submitUrl = isEditMode && existingBid?.updateUrl ? existingBid.updateUrl : job.bidStoreUrl;

        router.post(submitUrl, payload, {
            forceFormData: quoteFields.some((field) => field.type === 'file'),
            onSuccess: () => {
                setShowBidModal(false);
                setIsEditMode(false);
                if (!isEditMode) {
                    reset();
                    setQuoteValues({});
                }
            },
        });
    };

    const openBidModal = (edit = false) => {
        setIsEditMode(edit && Boolean(bidState?.canEdit && existingBid));
        setShowBidModal(true);
    };

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo} customPageTitle={customPageTitle}
            customSubPageTitle={customSubPageTitle} toRoute={toRoute}>
            <div className="job-details-section">
                <div className="container">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="job-details">
                                {job.isExpired && job.expiredLabel && (
                                    <div className="job-expired-notice job-expired-notice--detail mb-3" role="status">
                                        <i className="las la-exclamation-circle"></i> {job.expiredLabel}
                                    </div>
                                )}
                                <div className="details-item">
                                    <div className="bid-top">
                                        <div className="left">
                                            <h5 className="bid-top__title">{job.title}</h5>
                                            <small>{job.timeLabel}</small>
                                        </div>
                                        <div className="right">
                                            {job.customBudget && <sup className="d-block">Flexible budget available.</sup>}
                                            <h5 className="price">{job.budget}</h5>
                                            <small className="text">Bids: {job.bidsCount}</small>
                                            <small className="text">Interviews: {job.interviews}</small>
                                        </div>
                                    </div>
                                    <div className="details-item__content" dangerouslySetInnerHTML={{ __html: job.description }} />

                                    {job.requestFields?.length > 0 && (
                                        <div className="request-data-summary mt-4">
                                            <h6 className="mb-3">Request Details</h6>
                                            <div className="row gy-3">
                                                {job.requestFields.map((field) => (
                                                    <div key={field.name} className="col-md-6">
                                                        <div className="request-data-item">
                                                            <span className="request-data-item__label">{field.name}</span>
                                                            {field.isFile ? (
                                                                <a href={field.value} className="request-data-item__value" target="_blank" rel="noreferrer">
                                                                    <i className="las la-download"></i> Download file
                                                                </a>
                                                            ) : (
                                                                <span className="request-data-item__value">{field.value}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="project-info">
                                        <h6 className="project-info__title">About the job</h6>
                                        <div className="project-info-wrapper">
                                            {[
                                                { icon: 'las la-clock', label: 'Posted Job', value: job.postedAt },
                                                { icon: 'las la-calendar', label: 'Deadline', value: job.deadline },
                                                { icon: 'las la-brain', label: 'Experience level', value: job.skillLevel },
                                                { icon: 'las la-briefcase', label: 'Project Scope', value: job.projectScope },
                                                { icon: 'las la-map-marker', label: 'Job Longevity', value: job.jobLongevity },
                                                { icon: 'las la-map-marker', label: 'Location', value: '100% Remote job' },
                                            ].map((item) => (
                                                <div key={item.label} className="project-info__item">
                                                    <span className="project-info__icon"><i className={item.icon}></i></span>
                                                    <div className="project-info__content">
                                                        <p className="text">{item.label}</p>
                                                        <span className="title">{item.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="skill-expert-wrapper">
                                        <h6 className="skill-expert-wrapper__title">Skill and expertise</h6>
                                        <ul className="skill-list">
                                            {job.skills?.map((skill, index) => (
                                                <li key={index} className="skill-list__item">
                                                    <span className="skill-list__link">{skill.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {job.skillMatchPercent !== null && (
                                            <div className="skill-match-box mt-3">
                                                <h6>Skill Match</h6>
                                                <div className="progress">
                                                    <div className={`progress-bar ${job.skillMatchBar}`} style={{ width: `${job.skillMatchPercent}%`, minWidth: '30px' }}>
                                                        {job.skillMatchPercent}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {job.matchScore !== null && job.matchScore !== undefined && (
                                            <div className="skill-match-box mt-3">
                                                <h6>Location & Service Match</h6>
                                                <div className="progress">
                                                    <div className={`progress-bar ${job.matchScoreBar}`} style={{ width: `${job.matchScore}%`, minWidth: '30px' }}>
                                                        {job.matchScore}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {job.questions?.length > 0 && (
                                        <div className="question-section">
                                            <div className="question-header">
                                                <h4>Job questions for freelancers</h4>
                                            </div>
                                            <ul className="question-list">
                                                {job.questions.map((question, index) => (
                                                    <li key={index} className="question-item">
                                                        <i className="las la-question-circle question-icon"></i>
                                                        <span>{question}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="details-item">
                                    <div className="bid-wrapper">
                                        <div className="bid-wrapper__top">
                                            <h6 className="mb-0">{totalBiddenFreelancers} - Freelancers are bidding on this job</h6>
                                        </div>
                                        <div className="freelancers-wrapper">
                                            {freelancers.length ? freelancers.map((freelancer) => (
                                                <BidFreelancerCard key={freelancer.username} freelancer={freelancer} />
                                            )) : <EmptyState message="No quotes yet" description="Be the first provider to send a quote on this job." />}
                                        </div>
                                        {totalBiddenFreelancers > freelancers.length && (
                                            <div className="bid-wrapper__bottom">
                                                <button type="button" className="btn-outline--base btn" onClick={loadMoreFreelancers}>
                                                    Load more
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="sidebar-wrapper">
                                <div className="sidebar-header sidebar-item">
                                    <div className="sidebar-header__content">
                                        {auth?.user ? (
                                            <>
                                                {bidState.canEdit ? (
                                                    <button type="button" className="btn btn--base w-100 mt-3"
                                                        onClick={() => openBidModal(true)}>
                                                        <i className="las la-edit"></i> Edit Quote
                                                    </button>
                                                ) : (
                                                    <button type="button" className={`btn btn--base w-100 mt-3 ${bidState.disabled ? 'disabled' : ''}`}
                                                        disabled={bidState.disabled} onClick={() => openBidModal(false)}>
                                                        <i className="lab la-gavel"></i> Send Your Quote
                                                    </button>
                                                )}
                                                {bidState.hasBid && !bidState.canEdit && (
                                                    <p className="text-muted small mt-2 mb-0 text-center">
                                                        {bidState.attemptsRemaining > 0
                                                            ? `You used ${bidState.bidAttempts} of ${bidState.maxAttempts} quote attempts. You can submit again.`
                                                            : 'You have used all quote attempts on this request.'}
                                                    </p>
                                                )}
                                                {!bidState.hasBid && bidState.attemptsRemaining < bidState.maxAttempts && bidState.attemptsRemaining > 0 && (
                                                    <p className="text-muted small mt-2 mb-0 text-center">
                                                        {bidState.attemptsRemaining} of {bidState.maxAttempts} quote attempts remaining.
                                                    </p>
                                                )}
                                                {bidState.canEdit && (
                                                    <p className="text-muted small mt-2 mb-0 text-center">
                                                        You can update your pending quote anytime.
                                                    </p>
                                                )}
                                                {bidState.requestUpdatedAfterBid && (
                                                    <div className="alert alert-warning small mt-2 mb-0 py-2">
                                                        The buyer updated this request after you submitted your quote. Please review the latest details and update your bid if needed.
                                                    </div>
                                                )}
                                                {bidState.hadRejectedBid && !bidState.hasBid && (
                                                    <p className="text-muted small mt-2 mb-0 text-center">Your previous quote was rejected. You may submit a new one.</p>
                                                )}
                                                {!bidState.matchesProvider && bidState.profileComplete && !bidState.hasBid && (
                                                    <p className="text-muted small mt-2">Outside your usual categories or service areas — you can still submit a quote.</p>
                                                )}
                                                {!bidState.profileComplete && (
                                                    <small className="d-flex justify-content-center mt-1">Complete your work profile first!</small>
                                                )}
                                                {bidState.needsCreditsForNewQuote && !bidState.canAffordQuote && bidState.monetisation?.enabled && (
                                                    <div className="alert alert-warning small mt-2 mb-0 py-2">
                                                        {bidState.monetisation.unlimited_quotes ? (
                                                            <span>Your subscription does not include unlimited quotes for new submissions.</span>
                                                        ) : (
                                                            <>
                                                                Insufficient quote tokens. You need {bidState.monetisation.quote_cost} token(s) to submit a new quote
                                                                (balance: {bidState.monetisation.credits}).
                                                                {' '}
                                                                <Link href={routes.userLeadCredits ?? '/provider/lead-credits'} className="text--base">
                                                                    Buy tokens
                                                                </Link>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {bidState.monetisation?.enabled && bidState.canAffordQuote && bidState.needsCreditsForNewQuote && !bidState.monetisation.unlimited_quotes && (
                                                    <p className="text-muted small mt-2 mb-0 text-center">
                                                        Submitting a new quote uses {bidState.monetisation.quote_cost} quote token(s).
                                                        Balance: {bidState.monetisation.credits}.
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <Link href="/provider/login" className="btn btn--base w-100">Send Your Quote</Link>
                                        )}
                                        <p className="sidebar-header__text">
                                            By sending a quote, you have read and agreed to our{' '}
                                            {policies.map((policy, index) => (
                                                <span key={policy.slug}>
                                                    <Link href={policy.url} className="text--base">{policy.title}</Link>
                                                    {index < policies.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </p>
                                    </div>
                                    <div className="sidebar-header__shape">
                                        <img src={bannerShape} alt="" />
                                    </div>
                                </div>

                                <div className="sidebar-item buyer-info-item">
                                    <div className="top">
                                        <h6 className="sidebar-item__title">About the Buyer</h6>
                                        <div className="buyer-info">
                                            <div className="buyer-info__thumb">
                                                <img src={buyer.image} alt="" />
                                            </div>
                                            <div className="buyer-info__content">
                                                <p className="buyer-info__name">{buyer.fullname}</p>
                                                <div className="location">
                                                    <div className="text">{buyer.country} |</div>
                                                    <small>{buyer.address}</small>
                                                </div>
                                                <div className="text-wrapper">
                                                    <p className="text">{buyer.successPercent}% Job Success</p>
                                                    <p className="text">{buyer.successJobs} Complete Job</p>
                                                    <p className="text">{buyer.city}, {buyer.country}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sidebar-item">
                                    <h6 className="sidebar-item__title">Top skill jobs</h6>
                                    <ul className="performer-list">
                                        {topSkills.map((skill) => (
                                            <li key={skill.id} className="performer-list__item">
                                                <span className="text">{skill.name}</span>
                                                <span className="text">{skill.count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="sidebar-item">
                                    <h6 className="sidebar-item__title">Similar job posts</h6>
                                    <ul className="job-list">
                                        {similarJobList.map((item) => (
                                            <SimilarJobItem key={item.slug} job={item} />
                                        ))}
                                    </ul>
                                    {totalSimilarJobs > similarJobList.length && (
                                        <div className="sidebar-item__btn text-center">
                                            <button type="button" className="btn-outline--base btn" onClick={loadMoreSimilarJobs}>
                                                Load more
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBidModal && (
                <div className="modal custom--modal show d-block" id="bidModal" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleQuoteWizardSubmit}>
                                <div className="modal-body p-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-2">{isEditMode ? 'Update your quote' : job.title}</h5>
                                        <button type="button" className="btn-close" onClick={() => {
                                            setShowBidModal(false);
                                            setIsEditMode(false);
                                        }}></button>
                                    </div>

                                    <div className="quote-wizard-steps d-flex flex-wrap gap-2 mb-3">
                                        {quoteWizardSteps.map((label, index) => (
                                            <span
                                                key={label}
                                                className={`badge ${index === quoteStep ? 'bg--base' : index < quoteStep ? 'bg-success' : 'bg-secondary'}`}
                                            >
                                                {index + 1}. {label}
                                            </span>
                                        ))}
                                    </div>

                                    {quoteStep === 0 && (
                                        <>
                                            {!isEditMode && <h6 className="mb-3">{job.customBudget ? 'Estimated Budget' : 'Budget'}: {job.budget}</h6>}
                                            {showStandaloneBidAmount && (
                                                <div className="form-group mb-3">
                                                    <label className="form-label">Your Bid Amount</label>
                                                    <div className="input-group">
                                                        <input type="number" step="any" className="form-control form--control" name="bid_amount"
                                                            value={data.bid_amount} onChange={(e) => handleBidAmountChange(e.target.value)} required />
                                                        <span className="input-group-text">{job.currencyText}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {priceStepFields.length > 0 && (
                                                <RequestFormFields
                                                    fields={priceStepFields}
                                                    values={quoteValues}
                                                    onChange={handleQuoteFieldChange}
                                                />
                                            )}
                                            {isSummedTotal && (
                                                <div className="quote-total-box d-flex justify-content-between align-items-center mt-3 p-3">
                                                    <span className="fw-semibold">Total Quote</span>
                                                    <span className="fw-bold fs-5">
                                                        {summedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {job.currencyText}
                                                    </span>
                                                </div>
                                            )}
                                            {(errors.bid_amount) && (
                                                <div className="alert alert-danger small mt-2">{errors.bid_amount}</div>
                                            )}
                                        </>
                                    )}

                                    {quoteStep === 1 && (
                                        <div className="form-group mb-3">
                                            <label className="form-label">How long will it take?</label>
                                            <input type="text" className="form-control form--control" name="estimated_time"
                                                value={data.estimated_time} onChange={(e) => setData('estimated_time', e.target.value)}
                                                placeholder="e.g. 2 weeks" required />
                                            {errors.estimated_time && <small className="text-danger d-block mt-1">{errors.estimated_time}</small>}
                                        </div>
                                    )}

                                    {quoteStep === 2 && (
                                        <>
                                            {isEditMode && bidState?.requestUpdatedAfterBid && (
                                                <div className="alert alert-warning small mb-3">
                                                    The buyer updated this request. Review the latest request details on this page before saving your changes.
                                                </div>
                                            )}
                                            {detailsStepFields.length > 0 ? (
                                                <RequestFormFields
                                                    fields={detailsStepFields}
                                                    values={quoteValues}
                                                    onChange={handleQuoteFieldChange}
                                                />
                                            ) : (
                                                <div className="form-group mb-3">
                                                    <label className="form-label">Your Bid Quote</label>
                                                    <textarea className="form-control form--control" name="bid_quote" rows="5"
                                                        value={data.bid_quote} onChange={(e) => setData('bid_quote', e.target.value)} required />
                                                </div>
                                            )}
                                            {errors.bid_quote && <div className="alert alert-danger small">{errors.bid_quote}</div>}
                                        </>
                                    )}

                                    {quoteStep === 3 && (
                                        <div className="border rounded p-3 bg-light">
                                            <p className="mb-2"><strong>Price:</strong> {quotePriceLabel} {typeof quotePriceLabel === 'string' && !quotePriceLabel.includes(job.currencyText) ? job.currencyText : ''}</p>
                                            <p className="mb-2"><strong>Timeline:</strong> {data.estimated_time || '—'}</p>
                                            {!quoteFields.length && (
                                                <p className="mb-0"><strong>Proposal:</strong> {(data.bid_quote || '—').slice(0, 200)}{(data.bid_quote?.length > 200 ? '…' : '')}</p>
                                            )}
                                            {quoteFields.length > 0 && (
                                                <p className="mb-0 text-muted small">Custom quote fields will be submitted with your bid.</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-center mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline--secondary"
                                            disabled={quoteStep === 0 || processing}
                                            onClick={() => setQuoteStep((step) => Math.max(0, step - 1))}
                                        >
                                            Back
                                        </button>
                                        <button type="submit" className="btn btn--base" disabled={processing || !canAdvanceQuoteStep()}>
                                            {quoteStep === quoteWizardSteps.length - 1
                                                ? (isEditMode ? 'Update Quote' : 'Send Quote')
                                                : 'Next'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </FrontendLayout>
    );
}
