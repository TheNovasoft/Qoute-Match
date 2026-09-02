import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import VerificationBadges from '@/Components/Shared/VerificationBadges';
import { FreelancerCard } from '@/Components/Sections/SectionRenderer';
import StructuredReviewScores from '@/Components/Shared/StructuredReviewScores';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';
import { notify } from '@/utils/helpers';

export default function TalentProfile({
    pageTitle,
    seo,
    freelancer,
    customPageTitle,
    customSubPageTitle,
    toRoute,
    successfulJobs,
    successPercent,
    similarFreelancers,
    topSkills,
    reviews,
    dimensionAverages,
    portfolios,
    templateIcons,
}) {
    const { auth, routes, csrfToken } = usePage().props;

    const starCount = Math.min(Math.floor(Number(freelancer.avgRating) || 0), 5);
    const [inviteLoading, setInviteLoading] = useState(false);

    const inviteToBid = async () => {
        if (!freelancer.inviteUrl || inviteLoading) return;

        if (!auth?.buyer) {
            window.location.href = routes.buyerLogin ?? '/customer/login';
            return;
        }

        const confirmed = window.confirm(
            `Invite ${freelancer.fullname} to bid on your active requests?`,
        );

        if (!confirmed) return;

        setInviteLoading(true);

        try {
            const response = await fetch(freelancer.inviteUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                notify('error', data.message || 'Could not send the invitation.');
                return;
            }

            notify('success', data.message);
        } catch {
            notify('error', 'Could not send the invitation. Please try again.');
        } finally {
            setInviteLoading(false);
        }
    };

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo} customPageTitle={customPageTitle}
            customSubPageTitle={customSubPageTitle} toRoute={toRoute}>
            <div className="profile-section">
                <div className="container">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="profile-wrapper">
                                <div className="profile-wrapper__profile">
                                    <div className="profile-thumb">
                                        <img src={freelancer.image} alt="" />
                                    </div>
                                    <div className="main-content-wrapper">
                                        <div className="profile-content">
                                            <h5 className="profile-content__name">{freelancer.fullname}</h5>
                                            <VerificationBadges badges={freelancer.verificationBadges} className="mb-2" />
                                            <span className="profile-content__title">{freelancer.tagline}</span>
                                            <ul className="rating-list">
                                                {[...Array(starCount)].map((_, i) => (
                                                    <li key={i} className="rating-list__item"><i className="las la-star"></i></li>
                                                ))}
                                                <li className="rating-list__number">({freelancer.avgRating || 0})</li>
                                            </ul>
                                            <div className="profile-content__info">
                                                <div className="info-item">
                                                    <span className="info-item__thumb"><img src={templateIcons.check} alt="" /></span>
                                                    <p className="info-item__text">{successPercent}% Job Success</p>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-item__thumb"><img src={templateIcons.thumb} alt="" /></span>
                                                    <p className="info-item__text">{successfulJobs} Complete Job</p>
                                                </div>
                                                {freelancer.badge && (
                                                    <div className="info-item">
                                                        <span className="info-item__thumb"><img src={templateIcons.topRated} alt="" /></span>
                                                        <p className="info-item__text">{freelancer.badge.name} Level</p>
                                                    </div>
                                                )}
                                                <div className="info-item">
                                                    <span className="info-item__thumb"><img src={templateIcons.location} alt="" /></span>
                                                    <p className="info-item__text">{freelancer.city ? `${freelancer.city}, ` : ''}{freelancer.country}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="profile-action-btn">
                                            {freelancer.badge && (
                                                <div className="profile-badge">
                                                    <img src={freelancer.badge.image} title={freelancer.badge.name} alt="" />
                                                </div>
                                            )}
                                            {auth?.buyer ? (
                                                <button
                                                    type="button"
                                                    className="profile-action-btn__bid btn btn--sm"
                                                    onClick={inviteToBid}
                                                    disabled={inviteLoading}
                                                >
                                                    {inviteLoading ? 'Sending…' : freelancer.inviteLabel}
                                                </button>
                                            ) : (
                                                <Link href={routes.buyerLogin} className="profile-action-btn__bid btn btn--sm">Invite to bid</Link>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-wrapper__body">
                                    <div className="body-content">
                                        <h6 className="body-content__title">Why should you work with me ?</h6>
                                        <div className="body-content__desc" dangerouslySetInnerHTML={{ __html: freelancer.about || '' }} />
                                        <div className="proficiency-wrapper">
                                            <div className="proficiency-wrapper__item">
                                                <p className="proficiency-wrapper__title">My Specializations</p>
                                                <ul className="proficiency-list">
                                                    {freelancer.skills?.map((skill, index) => (
                                                        <li key={index} className="proficiency-list__item">{skill.name}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="review-wrapper">
                                        <h6 className="review-content__title">Recent Reviews</h6>
                                        <div className="review-content-container">
                                            {reviews.data?.length ? reviews.data.map((review) => (
                                                <div key={review.id} className="review-content">
                                                    <p className="review-content__name">{review.buyerName}</p>
                                                    <span className="review-content__address">From {review.buyerCountry}</span>
                                                    <ul className="review-rating-list">
                                                        {[...Array(Math.min(review.rating, 5))].map((_, i) => (
                                                            <li key={i} className="review-rating-list__item"><i className="las la-star"></i></li>
                                                        ))}
                                                    </ul>
                                                    <p className="review-content__desc">{review.review}</p>
                                                    {review.scores && (
                                                        <StructuredReviewScores
                                                            scores={Object.entries(review.scores).map(([key, item]) => ({
                                                                key,
                                                                label: item.label,
                                                                average: item.score,
                                                            }))}
                                                            compact
                                                            className="mt-2"
                                                        />
                                                    )}
                                                </div>
                                            )) : <EmptyState message="No recent reviews!" image={false} />}
                                        </div>
                                        {reviews.links?.length > 3 && <Pagination links={reviews.links} />}
                                    </div>

                                    {portfolios?.length > 0 && (() => {
                                        const projects = portfolios.filter((item) => item.item_type !== 'certificate');
                                        const certificates = portfolios.filter((item) => item.item_type === 'certificate');

                                        return (
                                            <>
                                                {projects.length > 0 && (
                                                    <div className="portfolio">
                                                        <h6 className="portfolio__title">Projects</h6>
                                                        <div className="portfolio-wrapper">
                                                            {projects.map((portfolio) => (
                                                                <div key={portfolio.id} className="portfolio-item">
                                                                    <div className="portfolio-item__thumb">
                                                                        <img src={portfolio.image} alt="" />
                                                                    </div>
                                                                    <div className="portfolio-item__content">
                                                                        <h6 className="portfolio-item__title">
                                                                            <span className="portfolio-item__title-link">{portfolio.title}</span>
                                                                        </h6>
                                                                        {portfolio.description && (
                                                                            <p className="portfolio-item__text mb-0">{portfolio.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {certificates.length > 0 && (
                                                    <div className="portfolio mt-4">
                                                        <h6 className="portfolio__title">Certificates</h6>
                                                        <div className="portfolio-wrapper">
                                                            {certificates.map((portfolio) => (
                                                                <div key={portfolio.id} className="portfolio-item portfolio-item--certificate">
                                                                    <div className="portfolio-item__thumb">
                                                                        <img src={portfolio.image} alt="" />
                                                                    </div>
                                                                    <div className="portfolio-item__content">
                                                                        <span className="badge badge--info mb-2">Certificate</span>
                                                                        <h6 className="portfolio-item__title">
                                                                            <span className="portfolio-item__title-link">{portfolio.title}</span>
                                                                        </h6>
                                                                        {portfolio.role && (
                                                                            <p className="text-muted small mb-1">{portfolio.role}</p>
                                                                        )}
                                                                        {portfolio.description && (
                                                                            <p className="portfolio-item__text mb-0">{portfolio.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="profile-wrapper__bottom">
                                    <h6 className="title">Freelancer Similar Skills</h6>
                                    <div className="row gy-4 justify-content-center">
                                        {similarFreelancers?.length ? similarFreelancers.map((item) => (
                                            <div key={item.username} className="col-xl-4 col-sm-6">
                                                <FreelancerCard freelancer={item} />
                                            </div>
                                        )) : <div className="col-12"><EmptyState message="No freelancer found!" /></div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="sidebar-wrapper">
                                {dimensionAverages?.some((item) => item.average > 0) && (
                                    <div className="sidebar-item">
                                        <h6 className="sidebar-item__title">Rating breakdown</h6>
                                        <StructuredReviewScores scores={dimensionAverages} compact />
                                    </div>
                                )}
                                {freelancer.verificationSummary?.length > 0 && (
                                    <div className="sidebar-item">
                                        <h6 className="sidebar-item__title">Verifications</h6>
                                        <div className="sidebar-item__verify">
                                            {freelancer.verificationSummary.map((item) => (
                                                <div className="verify-item" key={item.key}>
                                                    <span className="verify-item__icon">
                                                        <i className={item.icon}></i>
                                                    </span>
                                                    <div className="verify-item__content">
                                                        <span className="verify-item__title">{item.title}</span>
                                                        <p className={`verify-item__text${item.verified ? '' : ' unverified-text'}`}>
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}
