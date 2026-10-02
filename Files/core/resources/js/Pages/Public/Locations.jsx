import { Link } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';

export default function Locations({ pageTitle, seo, locations }) {
    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo} showBreadcrumb={false}>
            <section className="qm-loc-hero">
                <div className="container">
                    <p className="qm-loc-hero__eyebrow">Coverage across the UK</p>
                    <h1 className="qm-loc-hero__title">Service Locations</h1>
                    <p className="qm-loc-hero__desc">
                        Browse locations and compare quotes from verified builders, tradespeople, and freight providers.
                    </p>
                </div>
            </section>

            <section className="qm-loc-page pb-120">
                <div className="container">
                    <div className="qm-loc-grid">
                        {(locations || []).map((location) => (
                            <article key={location.id} className="qm-loc-card">
                                <div className="qm-loc-card__icon" aria-hidden="true">
                                    <i className="las la-map-marker-alt" />
                                </div>
                                <div className="qm-loc-card__body">
                                    <h2 className="qm-loc-card__title">{location.name}</h2>
                                    {location.region && (
                                        <p className="qm-loc-card__region">{location.region}</p>
                                    )}
                                    {location.intro && (
                                        <p className="qm-loc-card__desc">{location.intro}</p>
                                    )}
                                </div>
                                <Link href={location.url} className="qm-loc-card__cta">
                                    View services <i className="las la-arrow-right" aria-hidden="true" />
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
