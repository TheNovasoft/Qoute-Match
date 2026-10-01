export default function HowWorkSection({ data }) {
    return (
        <div className="how-wowrk-section qm-how-work my-120">
            <div className="container">
                <div className="row justify-content-center mb-4">
                    <div className="col-lg-8 text-center">
                        <div className="section-heading two">
                            <p className="qm-section-eyebrow">Simple process</p>
                            <h2 className="section-heading__title">{data.heading}</h2>
                            <p className="section-heading__desc">{data.subheading}</p>
                        </div>
                    </div>
                </div>
                <div className="qm-how-grid">
                    {data.elements?.map((item, index) => (
                        <div key={index} className="qm-how-card">
                            <span className="qm-how-card__step">{String(index + 1).padStart(2, '0')}</span>
                            <span
                                className="qm-how-card__icon"
                                dangerouslySetInnerHTML={{ __html: item.icon }}
                            />
                            <h5 className="qm-how-card__title">{item.title}</h5>
                            <p className="qm-how-card__desc">{item.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
