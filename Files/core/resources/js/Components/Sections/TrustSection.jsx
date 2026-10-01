export default function TrustSection({ data }) {
    if (!data?.items?.length) return null;

    return (
        <section className="trust-section qm-trust my-120">
            <div className="container">
                {(data.heading || data.subheading) && (
                    <div className="row justify-content-center mb-4">
                        <div className="col-lg-8 text-center">
                            <div className="section-heading two">
                                {data.heading && (
                                    <h2 className="section-heading__title">{data.heading}</h2>
                                )}
                                {data.subheading && (
                                    <p className="section-heading__desc">{data.subheading}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="qm-trust-grid">
                    {data.items.map((item, index) => (
                        <article key={index} className="qm-trust-card">
                            <span className="qm-trust-card__icon" aria-hidden="true">
                                <i className={item.icon || 'las la-shield-alt'}></i>
                            </span>
                            {item.title ? (
                                <h5 className="qm-trust-card__title">{item.title}</h5>
                            ) : null}
                            <p className="qm-trust-card__desc">{item.content}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
