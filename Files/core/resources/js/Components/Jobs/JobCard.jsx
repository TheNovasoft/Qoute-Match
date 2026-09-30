import { Link } from '@inertiajs/react';
import VerificationBadges from '@/Components/Shared/VerificationBadges';
import { useT } from '@/hooks/useT';

export default function JobCard({ job }) {
    const t = useT();

    return (
        <div className={`expert-developer${job.isExpired ? ' expert-developer--expired' : ''}`}>
            {job.isExpired && job.expiredLabel && (
                <div className="job-expired-notice" role="status">
                    <i className="las la-exclamation-circle"></i> {job.expiredLabel}
                </div>
            )}
            <div className="expert-developer__top">
                <div className="left">
                    <div className="left__top">
                        <h6 className="expert-developer__title">
                            <Link href={job.url}>{job.title}</Link>
                        </h6>
                    </div>
                    <span className="expert-developer__time">{job.timeLabel}</span>
                    <div className="job-information-area">
                        <div>
                            <span className="title">
                                {t('Budget')} <sup>[{job.customBudget ? t('Customized') : t('Fixed')}]</sup>
                            </span>
                            <p className="text">{job.budget}</p>
                        </div>
                        <div>
                            <span className="title">{t('Experience level')}</span>
                            <p className="text">{job.skillLevel}</p>
                        </div>
                    </div>
                </div>
                <div className="right">
                    <Link href={job.url} target="_blank" className="btn btn--base btn--xsm">{t('Bid Now')}</Link>
                    <p className="total-bid mt-1">
                        <span className="text">{t('Bids')}: {job.bidsCount}</span>
                    </p>
                </div>
            </div>
            <p className="expert-developer__desc">{job.description}</p>
            <ul className="skill-list justify-content-start">
                {job.skills?.map((skill, index) => (
                    <li key={index} className="skill-list__item">
                        <span className="skill-list__link">{skill.name}</span>
                    </li>
                ))}
            </ul>
            {job.skillMatch !== null && job.skillMatch !== undefined && (
                <div className="skill-match mt-2">
                    <small className="d-block mb-1">{t('Skill Match')}</small>
                    <div className="progress">
                        <div className={`progress-bar ${job.skillMatchBar}`} style={{ width: `${job.skillMatch}%`, minWidth: '25px' }}>
                            {job.skillMatch}%
                        </div>
                    </div>
                </div>
            )}
            {job.postcodeMatch && (
                <span className="badge badge--success badge--sm mt-2">{t('Postcode area match')}</span>
            )}
            {job.matchScore !== null && job.matchScore !== undefined && (
                <div className="skill-match mt-2">
                    <small className="d-block mb-1">{t('Location & Service Match')}</small>
                    <div className="progress">
                        <div className={`progress-bar ${job.matchScoreBar}`} style={{ width: `${job.matchScore}%`, minWidth: '25px' }}>
                            {job.matchScore}%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function BidFreelancerCard({ freelancer }) {
    const t = useT();

    return (
        <div className="bid-item">
            <Link href={freelancer.profileUrl} className="bid-item__thumb">
                <img src={freelancer.image} alt="" />
            </Link>
            <div className="bid-item__content">
                <div className="bid-item__top">
                    <div className="w-100">
                        <div className="d-flex justify-content-between mx-auto align-items-center">
                            <p className="bid-item__name mb-0 d-flex align-items-center flex-wrap gap-1">
                                {freelancer.fullname}
                                <VerificationBadges badges={freelancer.verificationBadges} compact />
                            </p>
                            <Link href={freelancer.profileUrl} className="btn btn--base btn--xsm">{t('View Profile')}</Link>
                        </div>
                        <div className="d-flex aligns-items-center gap-2 justify-content-start flex-wrap my-2">
                            <div className="location">
                                <p className="text"><i className="las la-globe"></i>{freelancer.country}</p>
                            </div>
                            <span className="text">{freelancer.successPercent}% {t('Job Success')}</span>
                            <span className="text">{t('Total Earned')} {freelancer.totalEarned}</span>
                            {freelancer.badge && <span className="text">{freelancer.badge.name}</span>}
                        </div>
                        <div className="freelancer-title">{freelancer.tagline}</div>
                        <ul className="review-rating-list">
                            {[...Array(Math.min(Math.floor(freelancer.avgRating), 5))].map((_, i) => (
                                <li key={i} className="review-rating-list__item"><i className="las la-star"></i></li>
                            ))}
                            <li className="rating-list__number">({freelancer.reviewsCount} {t('reviews')})</li>
                        </ul>
                    </div>
                </div>
                <p className="bid-item__desc">{freelancer.about}</p>
            </div>
        </div>
    );
}

export function SimilarJobItem({ job }) {
    const t = useT();

    return (
        <li className="job-list__item">
            <Link href={job.url} className="job-list__link">{job.title}</Link>
            <div className="d-flex align-items-center gap-3">
                <span className="text">{job.timeLabel}</span>
                <span className="text">{t('Deadline')} {job.deadline}</span>
            </div>
        </li>
    );
}
