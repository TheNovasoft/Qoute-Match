import { Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import { quotePostUrl } from '@/utils/quotePostUrl';
import { useT } from '@/hooks/useT';

export default function LocationDetail({ pageTitle, seo, location, intro, categories }) {
    const { routes, auth } = usePage().props;
    const postJobUrl = quotePostUrl(routes, auth);
    const t = useT();

    return (
        <FrontendLayout
            pageTitle={pageTitle}
            seo={seo}
            customSubPageTitle={t('Locations')}
            toRoute={routes.locations}
        >
            <section className="pb-120 seo-location-page">
                <div className="container">
                    <div className="row gy-4 align-items-start">
                        <div className="col-lg-5">
                            <h1 className="section-heading__title h2 mb-3">
                                {t('Service Providers in')} {location.name}
                            </h1>
                            {location.region && (
                                <p className="text-muted mb-3">{location.region}</p>
                            )}
                            <p className="section-heading__desc mb-4">{intro}</p>
                            <div className="d-flex flex-wrap gap-2">
                                <Link href={postJobUrl} className="btn btn--base">
                                    {t('Post a Requirement')}
                                </Link>
                                <Link href={routes.categories} className="btn btn-outline--base">
                                    {t('Browse Categories')}
                                </Link>
                            </div>
                            <p className="mt-3 mb-0">
                                <Link href={routes.locations} className="text--base">
                                    ← {t('All locations')}
                                </Link>
                            </p>
                        </div>

                        <div className="col-lg-7">
                            <h2 className="h4 mb-4">{t('Popular Categories')}</h2>
                            <div className="row gy-3">
                                {categories.map((category) => (
                                    <div key={category.id} className="col-md-6">
                                        <div className="subcategory-card h-100">
                                            <h3 className="subcategory-card__title">{category.name}</h3>
                                            {category.description && (
                                                <p className="subcategory-card__desc">{category.description}</p>
                                            )}
                                            <div className="d-flex flex-wrap gap-2 mt-auto pt-3">
                                                <Link href={category.serviceUrl} className="btn btn--base btn--sm">
                                                    {t('Get Quotes')}
                                                </Link>
                                                <Link href={category.categoryUrl} className="btn btn-outline--base btn--sm">
                                                    {t('Category')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
