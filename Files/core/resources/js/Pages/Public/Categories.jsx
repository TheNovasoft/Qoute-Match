import { Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import { useT } from '@/hooks/useT';

export default function Categories({ pageTitle, seo, categories }) {
    const t = useT();

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <section className="pb-120">
                <div className="container">
                    <div className="row justify-content-center mb-5">
                        <div className="col-lg-8 text-center">
                            <p className="section-heading__desc mb-0">
                                {t('Choose a category to post your requirement or browse open requests from verified providers.')}
                            </p>
                        </div>
                    </div>

                    <div className="row gy-4">
                        {categories.map((category) => (
                            <div key={category.id} className="col-lg-6">
                                <div className="category-browse-card h-100">
                                    <div className="category-browse-card__header">
                                        {category.image && (
                                            <Link href={category.url} className="category-browse-card__thumb">
                                                <img src={category.image} alt="" />
                                            </Link>
                                        )}
                                        <div className="category-browse-card__intro">
                                            <h2 className="category-browse-card__title">
                                                <Link href={category.url}>{category.name}</Link>
                                            </h2>
                                            {category.description && (
                                                <p className="category-browse-card__desc">{category.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="category-browse-card__body">
                                        <p className="category-browse-card__meta">
                                            {category.subcategories.length} {t('subcategories')}
                                            {category.jobsCount > 0 && ` · ${category.jobsCount} ${t('open requests')}`}
                                        </p>
                                        <div className="category-browse-card__tags">
                                            {category.subcategories.slice(0, 6).map((sub) => (
                                                <Link key={sub.id} href={sub.jobsUrl} className="category-tag">
                                                    {sub.name}
                                                </Link>
                                            ))}
                                            {category.subcategories.length > 6 && (
                                                <Link href={category.url} className="category-tag category-tag--more">
                                                    +{category.subcategories.length - 6} {t('more')}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 mt-3">
                                            <Link href={category.url} className="btn btn--base btn--sm">
                                                {t('View Subcategories')}
                                            </Link>
                                        </div>
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
