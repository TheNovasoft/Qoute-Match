import { Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import { quotePostUrl } from '@/utils/quotePostUrl';

export default function LocationDetail({ pageTitle, seo, location, intro, categories }) {
    const { routes, auth } = usePage().props;
    const postJobUrl = quotePostUrl(routes, auth);

    return (
        <FrontendLayout
            pageTitle={pageTitle}
            seo={seo}
            showBreadcrumb={false}
        >
            <section className="qm-loc-hero qm-loc-hero--detail">
                <div className="container">
                    <Link href={routes.locations} className="qm-loc-back">
                        ← All locations
                    </Link>
                    <p className="qm-loc-hero__eyebrow">{location.region || 'Local providers'}</p>
                    <h1 className="qm-loc-hero__title">Service Providers in {location.name}</h1>
                    <p className="qm-loc-hero__desc">{intro}</p>
                    <div className="qm-loc-hero__actions">
                        <Link href={postJobUrl} className="btn btn--base btn--lg">
                            Post a Requirement
                        </Link>
                        <Link href={routes.categories} className="btn btn-outline--base btn--lg">
                            Browse Categories
                        </Link>
                    </div>
                </div>
            </section>

            <section className="qm-loc-page pb-120">
                <div className="container">
                    <div className="qm-loc-section-head">
                        <h2>Popular categories in {location.name}</h2>
                        <p>Pick a service to see providers and request quotes in this area.</p>
                    </div>

                    <div className="qm-loc-cat-grid">
                        {(categories || []).map((category) => (
                            <article key={category.id} className="qm-loc-cat-card">
                                <div className="qm-loc-cat-card__icon" aria-hidden="true">
                                    <i className="las la-briefcase" />
                                </div>
                                <h3 className="qm-loc-cat-card__title">{category.name}</h3>
                                {category.description && (
                                    <p className="qm-loc-cat-card__desc">{category.description}</p>
                                )}
                                <div className="qm-loc-cat-card__actions">
                                    <Link href={category.serviceUrl} className="btn btn--base btn--sm">
                                        Get Quotes
                                    </Link>
                                    <Link href={category.categoryUrl} className="btn btn-outline--base btn--sm">
                                        Category
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
