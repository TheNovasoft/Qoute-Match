import { useT } from '@/hooks/useT';

export default function CategorySection({ data }) {
    const t = useT();

    if (!data.items?.length) return null;

    return (
        <div className="category-section my-120">
            <div className="container">
                <div className="row justify-content-center mb-4">
                    <div className="col-lg-8 text-center">
                        <div className="section-heading two">
                            <h2 className="section-heading__title">{data.heading}</h2>
                            {data.subheading && (
                                <p className="section-heading__desc">{data.subheading}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="category-slider">
                    {data.items.map((category) => (
                        <div key={category.id}>
                            <a href={category.url} className="category-item">
                                <div className="category-item__thumb"><img src={category.image} alt="" /></div>
                                <div className="category-item__content">
                                    <h5 className="category-item__title">{category.name}</h5>
                                    <p className="category-item__text">
                                        {category.jobsCount} {t('Open Requests')}
                                    </p>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
