import { Link, usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';

export default function Dashboard({ pageTitle, widget, user, profileCompletion, profileCompletionBadge }) {
    const { routes } = usePage().props;

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                {!user.work_profile_complete && user.step < 4 && (
                    <div className="profile-complete-notification">
                        <p>
                            <i className="las la-exclamation-circle"></i> Finish your profile to start bidding.{' '}
                            <Link className="update-link" href={routes?.userProfileSkill ?? '/provider/profile-skill'}>
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
                                    href={routes?.freelanceJobs ?? '/jobs'}
                                    className="btn btn--base dashboard-cta-card__btn"
                                >
                                    <i className="las la-search"></i> Browse Requests
                                </Link>
                            </div>
                        </div>

                        <div className="row g-3 g-md-4 justify-content-center dashboard-widget-grid">
                            <div className="col-12 col-sm-6 col-xl-3">
                                <Link className="dashboard-widget" href={routes?.userTransactions ?? '/provider/transactions'}>
                                    <div className="dashboard-widget__icon flex-center"><i className="las la-coins"></i></div>
                                    <div className="dashboard-widget__content">
                                        <span className="dashboard-widget__text">Total Earning</span>
                                        <h5 className="dashboard-widget__number">{widget.total_earning}</h5>
                                    </div>
                                </Link>
                            </div>
                            <div className="col-12 col-sm-6 col-xl-3">
                                <Link className="dashboard-widget" href={routes?.userBidIndex ?? '/provider/bid/list'}>
                                    <div className="dashboard-widget__icon flex-center"><i className="las la-gavel"></i></div>
                                    <div className="dashboard-widget__content">
                                        <span className="dashboard-widget__text">Total Bids</span>
                                        <h5 className="dashboard-widget__number">{widget.total_bid}</h5>
                                    </div>
                                </Link>
                            </div>
                            <div className="col-12 col-sm-6 col-xl-3">
                                <Link className="dashboard-widget" href={routes?.userProjectIndex ?? '/provider/project/index'}>
                                    <div className="dashboard-widget__icon flex-center"><i className="las la-briefcase"></i></div>
                                    <div className="dashboard-widget__content">
                                        <span className="dashboard-widget__text">Running Projects</span>
                                        <h5 className="dashboard-widget__number">{widget.total_running_project}</h5>
                                    </div>
                                </Link>
                            </div>
                            <div className="col-12 col-sm-6 col-xl-3">
                                <Link className="dashboard-widget" href={routes?.userProjectIndex ?? '/provider/project/index'}>
                                    <div className="dashboard-widget__icon flex-center"><i className="las la-check-circle"></i></div>
                                    <div className="dashboard-widget__content">
                                        <span className="dashboard-widget__text">Completed Projects</span>
                                        <h5 className="dashboard-widget__number">{widget.total_completed_project}</h5>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        <div className="row g-3 g-md-4 mt-1 dashboard-profile-row">
                            <div className="col-2 col-lg-6">
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
                                            <p className="mt-2 mb-0">{profileCompletionBadge}</p>
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
