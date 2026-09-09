import { Link, usePage } from '@inertiajs/react';

function UserTypeCard({ item }) {
    const { routes } = usePage().props;

    const href = item.routeKey === 'provider' ? routes.userRegister
        : item.routeKey === 'customer' ? routes.buyerRegister
            : null;

    return (
        <div className="col-12 col-md-6 col-lg-4">
            <div className="user-type-card h-100">
                {item.image ? (
                    <div className="user-type-card__thumb">
                        <img src={item.image} alt="" />
                    </div>
                ) : (
                    <div className="user-type-card__icon">
                        <i className={item.icon || 'las la-user-shield'}></i>
                    </div>
                )}
                <div className="user-type-card__body">
                    <span className="user-type-card__label">{item.label}</span>
                    <h4 className="user-type-card__title">{item.title}</h4>
                    <p className="user-type-card__desc">{item.content}</p>
                    {item.examples?.length > 0 && (
                        <ul className="user-type-card__examples">
                            {item.examples.map((example, index) => (
                                <li key={index}>{example}</li>
                            ))}
                        </ul>
                    )}
                    {href && item.buttonText && (
                        <Link href={href} className="btn btn--base btn--sm mt-3">
                            {item.buttonText}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserTypesSection({ data }) {
    return (
        <section className="user-types-section my-120">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="section-heading two">
                            <h2 className="section-heading__title s-highlight" data-s-break="-2" data-s-length="2">
                                {data.heading}
                            </h2>
                            <p className="section-heading__desc">{data.subheading}</p>
                        </div>
                    </div>
                </div>

                {data.bannerImage && (
                    <div className="user-types-banner mb-5">
                        <img src={data.bannerImage} alt="" />
                    </div>
                )}

                <div className="row gy-4">
                    {data.types?.map((item, index) => (
                        <UserTypeCard key={index} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
