import { Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';

function authQuery(params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            search.set(key, value);
        }
    });
    const query = search.toString();
    return query ? `?${query}` : '';
}

export default function Success({ pageTitle, job, buyerLoggedIn }) {
    const { routes } = usePage().props;
    const needsAccount = Boolean(job?.needsAccount);
    const email = job?.email || '';
    const firstname = job?.firstname || '';
    const lastname = job?.lastname || '';
    const phone = job?.phone || '';

    const registerUrl = `/customer/register${authQuery({ email, firstname, lastname, phone })}`;
    const loginUrl = `/customer/login${authQuery({ email })}`;

    return (
        <FrontendLayout pageTitle={pageTitle}>
            <section className="post-job-section py-5">
                <div className="container">
                    <div className="post-job-success card shadow-sm border-0 mx-auto" style={{ maxWidth: '640px' }}>
                        <div className="card-body p-4 p-md-5 text-center">
                            <div className="post-job-success__icon mb-3">
                                <i className="las la-check-circle" aria-hidden="true" />
                            </div>

                            {needsAccount ? (
                                <>
                                    <h1 className="h3 mb-2">Your project is ready</h1>
                                    <p className="text-muted mb-4">
                                        We saved your job details. Create a free account or log in to publish your
                                        project and start receiving quotes from providers.
                                        {email && (
                                            <>
                                                {' '}
                                                Your email <strong>{email}</strong> will be used for your account.
                                            </>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h1 className="h3 mb-2">Your job has been posted</h1>
                                    <p className="text-muted mb-4">
                                        {!job.published
                                            ? 'Your job has been saved as a draft. Log in to your customer dashboard to publish it when you are ready.'
                                            : job.approved
                                                ? 'Your request is live on Find Jobs. Providers can now send you quotes. Check your email for confirmation and manage everything from your customer account.'
                                                : 'Thanks — your request is in review. You will get an email as soon as it is approved and appears on Find Jobs. Manage it anytime from your customer account.'}
                                    </p>
                                </>
                            )}

                            {job.title && (
                                <p className="mb-4">
                                    <strong>{job.title}</strong>
                                </p>
                            )}

                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                {needsAccount ? (
                                    <>
                                        <Link href={registerUrl} className="btn btn--base">
                                            Create free account
                                        </Link>
                                        <Link href={loginUrl} className="btn btn-outline--base">
                                            Log in
                                        </Link>
                                    </>
                                ) : (
                                    buyerLoggedIn && (
                                        <Link href={routes.buyerJobList ?? '/customer/job/post/index'} className="btn btn--base">
                                            View my jobs
                                        </Link>
                                    )
                                )}
                                {!needsAccount && (
                                    <Link href={routes.freelanceJobs ?? '/jobs'} className="btn btn-outline--base">
                                        Browse requests
                                    </Link>
                                )}
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
