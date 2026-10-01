export default function CategorySection({ data }) {
    if (!data.items?.length) return null;

    return (
        <div className="category-section qm-categories my-120">
            <div className="container">
                <div className="row justify-content-between align-items-end mb-4 g-3">
                    <div className="col-lg-8">
                        <div className="section-heading two mb-0 text-start">
                            <p className="qm-section-eyebrow">Browse by trade</p>
                            <h2 className="section-heading__title">{data.heading}</h2>
                            {data.subheading && (
                                <p className="section-heading__desc mb-0">{data.subheading}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="qm-category-grid">
                    {data.items.map((category) => (
                        <a key={category.id} href={category.url} className="qm-category-card">
                            <div className="qm-category-card__thumb">
                                <img src={category.image} alt="" />
                            </div>
                            <div className="qm-category-card__body">
                                <h5 className="qm-category-card__title">{category.name}</h5>
                                <p className="qm-category-card__meta">{category.jobsCount} open requests</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
