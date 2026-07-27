import { Link, usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';

export default function Dashboard({ pageTitle, widget, user, profileCompletion, profileCompletionBadge }) {
    const { routes } = usePage().props;

    const cards = [
        { href: routes?.userTransactions ?? '/freelancer/transactions', label: 'Total Earning', value: widget.total_earning, icon: 'las la-coins' },
        { href: routes?.userBidIndex ?? '/freelancer/bid/list', label: 'Total Bids', value: widget.total_bid, icon: 'las la-gavel' },
        { href: routes?.userProjectIndex ?? '/freelancer/project/index', label: 'Running Projects', value: widget.total_running_project, icon: 'las la-briefcase' },
        { href: routes?.userProjectIndex ?? '/freelancer/project/index', label: 'Completed Projects', value: widget.total_completed_project, icon: 'las la-check-circle' },
    ];

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                {!user.work_profile_complete && user.step < 4 && (
                    <div className="profile-complete-notification">
                        <p>
                            <i className="las la-exclamation-circle"></i> Finish your profile to start bidding.{' '}
                            <Link className="update-link" href={routes?.userProfileSkill ?? '/freelancer/profile-skill'}>
                                Continue setup
                            </Link>
                            {' '}— one portfolio is enough.
                        </p>
                    </div>
                )}

                <div className="dashboard-body-wrapper mt-4">
                    <div className="dashboard-body-wrapper__content">
                        <div className="dashboard-card dashboard-cta-card mb-4">
                            <div className="dashboard-card__body d-flex flex-wrap justify-content-between align-items-center gap-3">
                                <div className="dashboard-cta-card__content">
                                    <h6 className="mb-1">Ready to submit a quote?</h6>
                                    <p className="text-muted mb-0 small">
                                        Browse customer requests, open a job, then click <strong>Bid on the project</strong>.
                                    </p>
                                </div>
                                <Link
                                    href={routes?.freelanceJobs ?? '/freelance-jobs'}
                                    className="btn btn--base dashboard-cta-card__btn"
                                >
                                    <i className="las la-search"></i> Browse Requests
                                </Link>
                            </div>
                        </div>

                        <div className="row gy-4 dashboard-widget-grid">
                            {cards.map((card) => (
                                <div className="col-xxl-3 col-sm-6" key={card.label}>
                                    <Link className="dashboard-widget" href={card.href}>
                                        <div className="dashboard-widget__main">
                                            <div className="dashboard-widget__icon flex-center">
                                                <i className={card.icon}></i>
                                            </div>
                                            <div className="dashboard-widget__content">
                                                <span className="dashboard-widget__text">{card.label}</span>
                                                <h5 className="dashboard-widget__number">{card.value}</h5>
                                            </div>
                                        </div>
                                        <span className="dashboard-widget__arrow">
                                            <i className="las la-angle-right"></i>
                                        </span>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="row gy-4 mt-1 dashboard-profile-row">
                            <div className="col-12 col-lg-6">
                                <div className="dashboard-card">
                                    <div className="dashboard-card__header">
                                        <h6 className="dashboard-card__title">Profile Completion</h6>
                                    </div>
                                    <div className="dashboard-card__body">
                                        <div className="progress">
                                            <div className="progress-bar" style={{ width: `${profileCompletion}%` }}>
                                                {profileCompletion}%
                                            </div>
                                        </div>
                                        {profileCompletionBadge && (
                                            <p className="mt-2 mb-0 text-muted small">{profileCompletionBadge}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}
