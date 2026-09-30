import { Link } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import { useT } from '@/hooks/useT';

export default function Locations({ pageTitle, seo, locations }) {
    const t = useT();

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <section className="pb-120 seo-location-page">
                <div className="container">
                    <div className="section-heading two text-center mb-5">
                        <h1 className="section-heading__title">{t('Service Locations')}</h1>
                        <p className="section-heading__desc mx-auto">
                            {t('Browse UK locations and compare quotes from verified builders, tradespeople, and freight providers.')}
                        </p>
                    </div>

                    <div className="row gy-4">
                        {locations.map((location) => (
                            <div key={location.id} className="col-md-6 col-lg-4">
                                <div className="subcategory-card h-100">
                                    <h2 className="subcategory-card__title h5 mb-2">{location.name}</h2>
                                    {location.region && (
                                        <p className="text-muted small mb-2">{location.region}</p>
                                    )}
                                    {location.intro && (
                                        <p className="subcategory-card__desc">{location.intro}</p>
                                    )}
                                    <div className="pt-3 mt-auto">
                                        <Link href={location.url} className="btn btn--base btn--sm">
                                            {t('View Services')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
