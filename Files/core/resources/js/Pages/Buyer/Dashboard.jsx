import { Link, usePage } from '@inertiajs/react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';

export default function Dashboard({ pageTitle, widget, holdBalance, kycAlert }) {
    const { routes } = usePage().props;

    const cards = [
        { href: routes.buyerProjects, label: 'Total Project', value: widget.total_project, icon: 'las la-coins' },
        { href: routes.buyerJobList, label: 'Total Job Bid', value: widget.total_bid, icon: 'las la-gavel' },
        { href: routes.buyerProjects, label: 'Running Project', value: widget.total_running_project, icon: 'las la-spinner' },
        { href: routes.buyerProjects, label: 'Reviewing Project', value: widget.total_reviewing_project, icon: 'las la-check-double' },
        { href: routes.buyerJobList, label: 'Completed Job', value: widget.total_job_completed, icon: 'las la-briefcase' },
        { href: routes.buyerTransactions, label: 'Hold Amount', value: holdBalance, icon: 'las la-hand-holding-usd' },
    ];

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                {kycAlert && (
                    <div className={`alert alert--${kycAlert.type} mb-4`} role="alert">
                        <div className="alert__content">
                            <h6 className="alert__title">{kycAlert.title}</h6>
                            <p className="alert__desc mb-0">
                                {kycAlert.message}
                                {kycAlert.actionUrl && (
                                    <>
                                        {' '}
                                        <Link href={kycAlert.actionUrl}>{kycAlert.actionLabel}</Link>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                <div className="dashboard-card dashboard-cta-card mb-4">
                    <div className="dashboard-card__body d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="dashboard-cta-card__content">
                            <h6 className="mb-1">Need quotes for a new request?</h6>
                            <p className="text-muted mb-0 small">
                                Post a job, review provider bids, and hire the best match for your project.
                            </p>
                        </div>
                        <Link
                            href={routes.buyerJobPost ?? '/customer/job/post/job-details'}
                            className="btn btn--base dashboard-cta-card__btn"
                        >
                            <i className="las la-plus-circle"></i> Post a Request
                        </Link>
                    </div>
                </div>

                <div className="row gy-4 dashboard-widget-grid">
                    {cards.map((card) => (
                        <div className="col-xxl-3 col-sm-6" key={card.label}>
                            <Link href={card.href ?? '#'} className="dashboard-widget">
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
            </div>
        </BuyerMasterLayout>
    );
}
