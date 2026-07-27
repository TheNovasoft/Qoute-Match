import { Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';

export default function Success({ pageTitle, job, buyerLoggedIn }) {
    const { routes } = usePage().props;

    return (
        <FrontendLayout pageTitle={pageTitle}>
            <section className="post-job-section py-5">
                <div className="container">
                    <div className="post-job-success card shadow-sm border-0 mx-auto" style={{ maxWidth: '640px' }}>
                        <div className="card-body p-4 p-md-5 text-center">
                            <div className="post-job-success__icon mb-3">
                                <i className="las la-check-circle" aria-hidden="true" />
                            </div>
                            <h1 className="h3 mb-2">Your job has been posted</h1>
                            <p className="text-muted mb-4">
                                {!job.published
                                    ? 'Your job has been saved as a draft. Log in to your customer dashboard to publish it when you are ready.'
                                    : job.approved
                                        ? 'Your request is live on Find Jobs. Providers can now send you quotes. Check your email for confirmation and manage everything from your customer account.'
                                        : 'Thanks — your request is in review. You will get an email as soon as it is approved and appears on Find Jobs. Manage it anytime from your customer account.'}
                            </p>
                            {job.title && (
                                <p className="mb-4">
                                    <strong>{job.title}</strong>
                                </p>
                            )}
                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                {buyerLoggedIn && (
                                    <Link href={routes.buyerJobList ?? '/customer/job/post/index'} className="btn btn--base">
                                        View my jobs
                                    </Link>
                                )}
                                <Link href={routes.freelanceJobs ?? '/jobs'} className="btn btn-outline--base">
                                    Browse requests
                                </Link>
                                <Link href={routes.home ?? '/'} className="btn btn-outline--dark">
                                    Back to home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
