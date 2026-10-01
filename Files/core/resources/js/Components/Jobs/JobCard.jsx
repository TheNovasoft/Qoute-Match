import { Link } from '@inertiajs/react';
import VerificationBadges from '@/Components/Shared/VerificationBadges';

export default function JobCard({ job }) {
    return (
        <article className={`qm-job-card expert-developer${job.isExpired ? ' expert-developer--expired qm-job-card--expired' : ''}`}>
            {job.isExpired && job.expiredLabel && (
                <div className="job-expired-notice qm-job-card__notice" role="status">
                    <i className="las la-exclamation-circle"></i> {job.expiredLabel}
                </div>
            )}

            <div className="qm-job-card__head">
                <div className="qm-job-card__head-main">
                    <h3 className="qm-job-card__title expert-developer__title">
                        <Link href={job.url}>{job.title}</Link>
                    </h3>
                    <div className="qm-job-card__meta">
                        <span className="qm-job-card__meta-item">
                            <i className="las la-clock" aria-hidden="true"></i>
                            {job.timeLabel}
                        </span>
                        <span className="qm-job-card__meta-item">
                            <i className="las la-gavel" aria-hidden="true"></i>
                            {job.bidsCount} {Number(job.bidsCount) === 1 ? 'quote' : 'quotes'}
                        </span>
                        {job.postcodeMatch && (
                            <span className="qm-job-card__chip qm-job-card__chip--success">Area match</span>
                        )}
                    </div>
                </div>
                <Link href={job.url} className="btn btn--base qm-job-card__cta">
                    View & quote
                </Link>
            </div>

            <div className="qm-job-card__stats">
                <div className="qm-job-card__stat">
                    <span className="qm-job-card__stat-label">
                        Budget · {job.customBudget ? 'Custom' : 'Fixed'}
                    </span>
                    <span className="qm-job-card__stat-value">{job.budget}</span>
                </div>
                <div className="qm-job-card__stat">
                    <span className="qm-job-card__stat-label">Experience</span>
                    <span className="qm-job-card__stat-value">{job.skillLevel}</span>
                </div>
            </div>

            {job.description && (
                <p className="qm-job-card__desc expert-developer__desc">{job.description}</p>
            )}

            {job.skills?.length > 0 && (
                <ul className="qm-job-card__tags skill-list">
                    {job.skills.map((skill, index) => (
                        <li key={index} className="qm-job-card__tag skill-list__item">
                            <span className="skill-list__link">{skill.name}</span>
                        </li>
                    ))}
                </ul>
            )}

            {(job.skillMatch != null || job.matchScore != null) && (
                <div className="qm-job-card__matches">
                    {job.skillMatch != null && (
                        <div className="qm-job-card__match">
                            <div className="qm-job-card__match-label">
                                <span>Skill match</span>
                                <strong>{job.skillMatch}%</strong>
                            </div>
                            <div className="progress">
                                <div
                                    className={`progress-bar ${job.skillMatchBar}`}
                                    style={{ width: `${job.skillMatch}%`, minWidth: '24px' }}
                                />
                            </div>
                        </div>
                    )}
                    {job.matchScore != null && (
                        <div className="qm-job-card__match">
                            <div className="qm-job-card__match-label">
                                <span>Location match</span>
                                <strong>{job.matchScore}%</strong>
                            </div>
                            <div className="progress">
                                <div
                                    className={`progress-bar ${job.matchScoreBar}`}
                                    style={{ width: `${job.matchScore}%`, minWidth: '24px' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

export function BidFreelancerCard({ freelancer }) {
    return (
        <div className="bid-item qm-talent-row">
            <Link href={freelancer.profileUrl} className="bid-item__thumb">
                <img src={freelancer.image} alt="" />
            </Link>
            <div className="bid-item__content">
                <div className="bid-item__top">
                    <div className="w-100">
                        <div className="d-flex justify-content-between mx-auto align-items-center gap-2 flex-wrap">
                            <p className="bid-item__name mb-0 d-flex align-items-center flex-wrap gap-1">
                                {freelancer.fullname}
                                <VerificationBadges badges={freelancer.verificationBadges} compact />
                            </p>
                            <Link href={freelancer.profileUrl} className="btn btn--base btn--xsm">View profile</Link>
                        </div>
                        <div className="d-flex aligns-items-center gap-2 justify-content-start flex-wrap my-2">
                            <div className="location">
                                <p className="text"><i className="las la-globe"></i>{freelancer.country}</p>
                            </div>
                            <span className="text">{freelancer.successPercent}% job success</span>
                            <span className="text">Earned {freelancer.totalEarned}</span>
                            {freelancer.badge && <span className="text">{freelancer.badge.name}</span>}
                        </div>
                        <div className="freelancer-title">{freelancer.tagline}</div>
                        <ul className="review-rating-list">
                            {[...Array(Math.min(Math.floor(freelancer.avgRating), 5))].map((_, i) => (
                                <li key={i} className="review-rating-list__item"><i className="las la-star"></i></li>
                            ))}
                            <li className="rating-list__number">({freelancer.reviewsCount} reviews)</li>
                        </ul>
                    </div>
                </div>
                <p className="bid-item__desc">{freelancer.about}</p>
            </div>
        </div>
    );
}

export function SimilarJobItem({ job }) {
    return (
        <li className="job-list__item qm-similar-job">
            <Link href={job.url} className="job-list__link">{job.title}</Link>
            <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="text">{job.timeLabel}</span>
                <span className="text">Deadline {job.deadline}</span>
            </div>
        </li>
    );
}
