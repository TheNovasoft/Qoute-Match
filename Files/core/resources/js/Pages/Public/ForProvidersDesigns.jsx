import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';

const STEPS = [
    {
        icon: 'las la-user-plus',
        title: 'Register your business',
        text: 'Create your provider account and complete your business profile.',
    },
    {
        icon: 'las la-shield-alt',
        title: 'Get verified',
        text: 'Upload insurance and certificates — our admin team verifies you.',
    },
    {
        icon: 'las la-bullseye',
        title: 'Receive matching leads',
        text: 'Get customer requests that match your categories and service areas.',
    },
    {
        icon: 'las la-file-invoice-dollar',
        title: 'Submit structured quotes',
        text: 'Quote with confidence. New quotes use lead credits unless you have unlimited.',
    },
];

function stripHtml(html = '') {
    return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function ForProvidersDesigns({ data = {} }) {
    const { routes, auth } = usePage().props;

    const heading = data.heading || 'For Service Providers';
    const subheading = data.subheading
        || 'Receive matching customer requests and submit structured quotes.';
    const money = useMemo(() => {
        const body = stripHtml(data.body || '');
        const idx = body.toLowerCase().indexOf('monetisation');
        if (idx >= 0) {
            const text = body.slice(idx).replace(/^monetisation\s*/i, '').trim();
            if (text) return text;
        }
        return 'Customer posting is free. Providers pay for lead credits or a subscription. New providers receive welcome credits to get started.';
    }, [data.body]);

    const registerUrl = auth?.user ? routes.userHome : (data.buttonUrl || routes.userRegister);
    const loginUrl = routes.userLogin;

    return (
        <div className="qm-fp qm-fp--5">
            <section className="qm-fp5-hero">
                <div className="container text-center">
                    <span className="qm-fp5-badge">
                        <i className="las la-check-circle" /> Verified provider network
                    </span>
                    <h1>{heading}</h1>
                    <p className="qm-fp-lead qm-fp-lead--center">{subheading}</p>
                    <div className="qm-fp-cta justify-content-center">
                        <Link href={registerUrl} className="btn btn--base btn--lg">
                            {data.buttonText || 'Join as Provider'}
                        </Link>
                        <Link href={loginUrl} className="btn btn-outline--base btn--lg">
                            Provider Login
                        </Link>
                    </div>
                </div>
            </section>

            <section className="qm-fp-section">
                <div className="container">
                    <div className="qm-fp5-layout">
                        <div>
                            <h2 className="qm-fp-h2">Your path to live leads</h2>
                            <ol className="qm-fp5-timeline">
                                {STEPS.map((step) => (
                                    <li key={step.title}>
                                        <i className={step.icon} aria-hidden="true" />
                                        <div>
                                            <h3>{step.title}</h3>
                                            <p>{step.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <aside className="qm-fp5-aside">
                            <h2>Monetisation</h2>
                            <p>{money}</p>
                            <ul>
                                <li>Customer posting stays free</li>
                                <li>Pay per quote with lead credits</li>
                                <li>Or go unlimited with a plan</li>
                                <li>Welcome credits for new providers</li>
                            </ul>
                            <Link href={registerUrl} className="btn btn--base btn--lg w-100">
                                Join as Provider
                            </Link>
                        </aside>
                    </div>
                </div>
            </section>
        </div>
    );
}
