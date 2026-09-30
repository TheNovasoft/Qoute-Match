import { Head, Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import { useT } from '@/hooks/useT';

export default function CategoryLocation({
    pageTitle,
    seo,
    category,
    location,
    headline,
    intro,
    otherLocations,
}) {
    const { routes } = usePage().props;
    const t = useT();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: headline,
        description: seo?.description,
        url: seo?.canonical,
        about: {
            '@type': 'Service',
            name: category.name,
            areaServed: location.name,
        },
    };

    return (
        <FrontendLayout
            pageTitle={pageTitle}
            seo={seo}
            customSubPageTitle={category.name}
            toRoute={routes.categories}
        >
            <Head>
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>

            <section className="pb-120 seo-location-page">
                <div className="container">
                    <div className="row gy-4 align-items-start">
                        <div className="col-lg-5">
                            <h1 className="section-heading__title h2 mb-3">{headline}</h1>
                            <p className="section-heading__desc mb-4">{intro}</p>
                            <div className="d-flex flex-wrap gap-2">
                                <Link href={category.postUrl} className="btn btn--base">
                                    {t('Get Free Quotes')}
                                </Link>
                                <Link href={category.jobsUrl} className="btn btn-outline--base">
                                    {t('Browse Requests')} ({category.jobsCount})
                                </Link>
                            </div>
                            <p className="mt-3 mb-0">
                                <Link href={location.url} className="text--base">
                                    ← {location.name}
                                </Link>
                                {' · '}
                                <Link href={routes.categories} className="text--base">
                                    {t('All categories')}
                                </Link>
                            </p>
                        </div>

                        <div className="col-lg-7">
                            <h2 className="h4 mb-4">{t('Subcategories')}</h2>
                            <div className="row gy-3 mb-5">
                                {category.subcategories.map((sub) => (
                                    <div key={sub.id} className="col-md-6">
                                        <div className="subcategory-card h-100">
                                            <h3 className="subcategory-card__title">{sub.name}</h3>
                                            {sub.description && (
                                                <p className="subcategory-card__desc">{sub.description}</p>
                                            )}
                                            <div className="d-flex flex-wrap gap-2 mt-auto pt-3">
                                                <Link href={sub.postUrl} className="btn btn--base btn--sm">
                                                    {t('Get Quotes')}
                                                </Link>
                                                <Link href={sub.jobsUrl} className="btn btn-outline--base btn--sm">
                                                    {t('Browse')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {otherLocations.length > 0 && (
                                <>
                                    <h2 className="h4 mb-3">{t('Also available in')}</h2>
                                    <div className="d-flex flex-wrap gap-2">
                                        {otherLocations.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={item.serviceUrl}
                                                className="category-tag"
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
