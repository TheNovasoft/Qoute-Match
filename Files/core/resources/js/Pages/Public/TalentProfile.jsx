import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import VerificationBadges from '@/Components/Shared/VerificationBadges';
import { FreelancerCard } from '@/Components/Sections/SectionRenderer';
import StructuredReviewScores from '@/Components/Shared/StructuredReviewScores';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';
import { notify } from '@/utils/helpers';
import { useT } from '@/hooks/useT';

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
    services = [],
    templateIcons,
}) {
    const t = useT();
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
            t('Invite :name to bid on your active requests?').replace(':name', freelancer.fullname),
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
                notify('error', data.message || t('Could not send the invitation.'));
                return;
            }

            notify('success', data.message);
        } catch {
            notify('error', t('Could not send the invitation. Please try again.'));
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
                                            {freelancer.presenceLabel && (
                                                <span className={`provider-presence provider-presence--${freelancer.presence || 'offline'} mb-2 d-inline-block`}>
                                                    {freelancer.presenceLabel}
                                                </span>
                                            )}
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
                                                    <p className="info-item__text">{successPercent}% {t('Job Success')}</p>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-item__thumb"><img src={templateIcons.thumb} alt="" /></span>
                                                    <p className="info-item__text">{successfulJobs} {t('Complete Job')}</p>
                                                </div>
                                                {freelancer.badge && (
                                                    <div className="info-item">
                                                        <span className="info-item__thumb"><img src={templateIcons.topRated} alt="" /></span>
                                                        <p className="info-item__text">{freelancer.badge.name} {t('Level')}</p>
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
                                                    {inviteLoading ? t('Sending…') : freelancer.inviteLabel}
                                                </button>
                                            ) : (
                                                <Link href={routes.buyerLogin} className="profile-action-btn__bid btn btn--sm">{t('Invite to bid')}</Link>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-wrapper__body">
                                    <div className="body-content">
                                        <h6 className="body-content__title">{t('Why should you work with me ?')}</h6>
                                        <div className="body-content__desc" dangerouslySetInnerHTML={{ __html: freelancer.about || '' }} />
                                        {services.length > 0 && (
                                            <div className="proficiency-wrapper mb-4">
                                                <div className="proficiency-wrapper__item w-100">
                                                    <p className="proficiency-wrapper__title">{t('Service Packages')}</p>
                                                    <div className="row gy-3">
                                                        {services.map((service) => (
                                                            <div className="col-md-6" key={service.id}>
                                                                <div className="card custom--card h-100">
                                                                    <div className="card-body">
                                                                        <h6 className="mb-1">{service.title}</h6>
                                                                        <p className="text--base fw-semibold mb-2">{service.price}</p>
                                                                        <p className="small text-muted mb-2">{t('Delivery')}: {service.deliveryDays} {t('days')}</p>
                                                                        {service.description && <p className="small mb-0">{service.description}</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="proficiency-wrapper">
                                            <div className="proficiency-wrapper__item">
                                                <p className="proficiency-wrapper__title">{t('My Specializations')}</p>
                                                <ul className="proficiency-list">
                                                    {freelancer.skills?.map((skill, index) => (
                                                        <li key={index} className="proficiency-list__item">{skill.name}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="review-wrapper">
                                        <h6 className="review-content__title">{t('Recent Reviews')}</h6>
                                        <div className="review-content-container">
                                            {reviews.data?.length ? reviews.data.map((review) => (
                                                <div key={review.id} className="review-content">
                                                    <p className="review-content__name">{review.buyerName}</p>
                                                    <span className="review-content__address">{t('From')} {review.buyerCountry}</span>
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
                                            )) : <EmptyState message={t('No recent reviews!')} image={false} />}
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
                                                        <h6 className="portfolio__title">{t('Projects')}</h6>
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
                                                        <h6 className="portfolio__title">{t('Certificates')}</h6>
                                                        <div className="portfolio-wrapper">
                                                            {certificates.map((portfolio) => (
                                                                <div key={portfolio.id} className="portfolio-item portfolio-item--certificate">
                                                                    <div className="portfolio-item__thumb">
                                                                        <img src={portfolio.image} alt="" />
                                                                    </div>
                                                                    <div className="portfolio-item__content">
                                                                        <span className="badge badge--info mb-2">{t('Certificate')}</span>
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
                                    <h6 className="title">{t('Freelancer Similar Skills')}</h6>
                                    <div className="row gy-4 justify-content-center">
                                        {similarFreelancers?.length ? similarFreelancers.map((item) => (
                                            <div key={item.username} className="col-xl-4 col-sm-6">
                                                <FreelancerCard freelancer={item} />
                                            </div>
                                        )) : <div className="col-12"><EmptyState message={t('No freelancer found!')} /></div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="sidebar-wrapper">
                                {dimensionAverages?.some((item) => item.average > 0) && (
                                    <div className="sidebar-item">
                                        <h6 className="sidebar-item__title">{t('Rating breakdown')}</h6>
                                        <StructuredReviewScores scores={dimensionAverages} compact />
                                    </div>
                                )}
                                {freelancer.verificationSummary?.length > 0 && (
                                    <div className="sidebar-item">
                                        <h6 className="sidebar-item__title">{t('Verifications')}</h6>
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
                                    <h6 className="sidebar-item__title">{t('Top skill jobs')}</h6>
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
