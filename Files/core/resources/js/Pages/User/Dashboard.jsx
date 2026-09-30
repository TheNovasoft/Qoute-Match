import { Link, usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import { profileContinueHref } from '@/Components/Profile/ProfileSteps';

export default function Dashboard({ pageTitle, widget, user, profileCompletion, profileCompletionBadge }) {
    const { routes } = usePage().props;

    const findJobsHref = routes?.freelanceJobs ?? '/freelance-jobs';
    const quotesHref = routes?.userBidIndex ?? '/freelancer/bid/list';
    const jobsHref = routes?.userProjectIndex ?? '/freelancer/project/index';

    const cards = [
        { href: quotesHref, label: 'Quotes sent', value: widget.total_bid, icon: 'las la-gavel' },
        { href: jobsHref, label: 'Jobs in progress', value: widget.total_running_project, icon: 'las la-briefcase' },
        { href: jobsHref, label: 'Jobs finished', value: widget.total_completed_project, icon: 'las la-check-circle' },
    ];

    const steps = [
        {
            n: '1',
            title: 'Find a job',
            text: 'Open local customer requests that match your trade.',
            href: findJobsHref,
            btn: 'Browse jobs',
            icon: 'las la-search',
        },
        {
            n: '2',
            title: 'Send a quote',
            text: 'Open a job and send your price — keep it clear and fair.',
            href: quotesHref,
            btn: 'My quotes',
            icon: 'las la-gavel',
        },
        {
            n: '3',
            title: 'Do the work',
            text: 'When hired, manage the job and chat with the customer here.',
            href: jobsHref,
            btn: 'My jobs',
            icon: 'las la-briefcase',
        },
    ];

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                {!user.work_profile_complete && user.step < 4 && (
                    <div className="profile-complete-notification">
                        <p>
                            <i className="las la-exclamation-circle"></i> Finish your profile to start quoting.{' '}
                            <Link className="update-link" href={profileContinueHref(routes, user.step)}>
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
                                    <h5 className="mb-1">Ready for work?</h5>
                                    <p className="text-muted mb-0">
                                        Browse open jobs near you and send a quote in a few taps.
                                    </p>
                                </div>
                                <Link
                                    href={findJobsHref}
                                    className="btn btn--base btn--lg dashboard-cta-card__btn"
                                >
                                    <i className="las la-search"></i> Find jobs
                                </Link>
                            </div>
                        </div>

                        <div className="row gy-3 mb-4">
                            {steps.map((step) => (
                                <div className="col-md-4" key={step.n}>
                                    <div className="dashboard-card h-100">
                                        <div className="dashboard-card__body">
                                            <div className="d-flex align-items-start gap-3 mb-3">
                                                <span
                                                    className="flex-center rounded-circle bg--base text-white"
                                                    style={{ width: 36, height: 36, minWidth: 36, fontWeight: 700 }}
                                                >
                                                    {step.n}
                                                </span>
                                                <div>
                                                    <h6 className="mb-1">
                                                        <i className={`${step.icon} me-1`}></i>
                                                        {step.title}
                                                    </h6>
                                                    <p className="text-muted small mb-0">{step.text}</p>
                                                </div>
                                            </div>
                                            <Link href={step.href} className="btn btn-outline--base btn-sm">
                                                {step.btn}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="row gy-4 dashboard-widget-grid">
                            {cards.map((card) => (
                                <div className="col-md-4 col-sm-6" key={card.label}>
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

                        {profileCompletion < 100 && (
                            <div className="row gy-4 mt-1 dashboard-profile-row">
                                <div className="col-12 col-lg-6">
                                    <div className="dashboard-card">
                                        <div className="dashboard-card__header">
                                            <h6 className="dashboard-card__title">Profile setup</h6>
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
                                            <Link
                                                className="btn btn-outline--base btn-sm mt-3"
                                                href={profileContinueHref(routes, user.step)}
                                            >
                                                Continue setup
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}
