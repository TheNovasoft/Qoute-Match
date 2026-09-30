import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import JobPostFormTranslateButton from '@/Components/Jobs/JobPostFormTranslateButton';
import {
    JobPostFormAutoTranslate,
    JobPostFormTranslationProvider,
    useJobPostFormTranslation,
} from '@/Components/Jobs/JobPostFormTranslationProvider';
import { collectJobPostSuccessStrings } from '@/utils/jobPostSuccessStrings';

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

function SuccessContent({ job, buyerLoggedIn }) {
    const { routes } = usePage().props;
    const { tx } = useJobPostFormTranslation();
    const needsAccount = Boolean(job?.needsAccount);
    const email = job?.email || '';
    const firstname = job?.firstname || '';
    const lastname = job?.lastname || '';
    const phone = job?.phone || '';

    const registerUrl = `/customer/register${authQuery({ email, firstname, lastname, phone })}`;
    const loginUrl = `/customer/login${authQuery({ email })}`;

    const successStrings = useMemo(
        () => collectJobPostSuccessStrings({ email, title: job?.title }),
        [email, job?.title],
    );

    return (
        <>
            <JobPostFormAutoTranslate strings={successStrings} />
            <section className="post-job-section py-5">
                <div className="container">
                    <div className="post-job-success card shadow-sm border-0 mx-auto position-relative" style={{ maxWidth: '640px' }}>
                        <div className="job-flow-translate-one position-absolute top-0 end-0 m-3">
                            <JobPostFormTranslateButton strings={successStrings} />
                        </div>
                        <div className="card-body p-4 p-md-5 text-center">
                            <div className="post-job-success__icon mb-3">
                                <i className="las la-check-circle" aria-hidden="true" />
                            </div>

                            {needsAccount ? (
                                <>
                                    <h1 className="h3 mb-2">{tx('Your project is ready')}</h1>
                                    <p className="text-muted mb-4">
                                        {tx('We saved your job details. Create a free account or log in to publish your project and start receiving quotes from providers.')}
                                        {email && (
                                            <>
                                                {' '}
                                                {tx('Your email')} <strong>{email}</strong> {tx('will be used for your account.')}
                                            </>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h1 className="h3 mb-2">{tx('Your job has been posted')}</h1>
                                    <p className="text-muted mb-4">
                                        {tx(
                                            !job.published
                                                ? 'Your job has been saved as a draft. Log in to your customer dashboard to publish it when you are ready.'
                                                : job.approved
                                                    ? 'Your request is live on Find Jobs. Providers can now send you quotes. Check your email for confirmation and manage everything from your customer account.'
                                                    : 'Thanks — your request is in review. You will get an email as soon as it is approved and appears on Find Jobs. Manage it anytime from your customer account.',
                                        )}
                                    </p>
                                    {(job.email || job.temp_password) && (
                                        <div className="text-start border rounded-3 p-3 mb-4 bg-light">
                                            <p className="mb-2 fw-semibold">{tx('Your login details')}</p>
                                            {job.email && (
                                                <p className="mb-1 small">
                                                    {tx('Email')}: <strong>{job.email}</strong>
                                                </p>
                                            )}
                                            {job.temp_password && (
                                                <p className="mb-0 small">
                                                    {tx('Temporary password')}: <strong>{job.temp_password}</strong>
                                                </p>
                                            )}
                                            <p className="mb-0 mt-2 small text-muted">
                                                {tx('We also emailed these details. If the inbox is empty, check spam or use the password above to sign in.')}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {job.title && (
                                <p className="mb-4">
                                    <strong>{tx(job.title)}</strong>
                                </p>
                            )}

                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                {needsAccount ? (
                                    <>
                                        <Link href={registerUrl} className="btn btn--base">
                                            {tx('Create free account')}
                                        </Link>
                                        <Link href={loginUrl} className="btn btn-outline--base">
                                            {tx('Log in')}
                                        </Link>
                                    </>
                                ) : (
                                    buyerLoggedIn && (
                                        <Link href={routes.buyerJobList ?? '/customer/job/post/index'} className="btn btn--base">
                                            {tx('View my jobs')}
                                        </Link>
                                    )
                                )}
                                {!needsAccount && (
                                    <Link href={routes.freelanceJobs ?? '/jobs'} className="btn btn-outline--base">
                                        {tx('Browse requests')}
                                    </Link>
                                )}
                                <Link href={routes.home ?? '/'} className="btn btn-outline--dark">
                                    {tx('Back to home')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default function Success({ pageTitle, job, buyerLoggedIn }) {
    const { formTranslateLocale } = usePage().props;

    return (
        <FrontendLayout pageTitle={pageTitle}>
            <JobPostFormTranslationProvider locale={formTranslateLocale}>
                <SuccessContent job={job} buyerLoggedIn={buyerLoggedIn} />
            </JobPostFormTranslationProvider>
        </FrontendLayout>
    );
}
