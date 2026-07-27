function HowWorkArrow() {
    return (
        <svg viewBox="0 0 100 40" width="100" height="40" aria-hidden="true" className="how-work-arrow">
            <path
                d="M4 32 C30 6 58 6 86 22"
                fill="none"
                stroke="#0071e3"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            <path
                d="M72 12 L88 22 L70 28"
                fill="none"
                stroke="#0071e3"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function HowWorkSection({ data }) {
    return (
        <div className="how-wowrk-section my-120">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="section-heading two">
                            <h2 className="section-heading__title s-highlight" data-s-break="-2" data-s-length="2">{data.heading}</h2>
                            <p className="section-heading__desc">{data.subheading}</p>
                        </div>
                    </div>
                </div>
                <div className="row gy-4">
                    {data.elements?.map((item, index) => (
                        <div key={index} className="col-lg-4 col-md-6">
                            <div className="how-work-item">
                                <span className="how-work-item__icon" dangerouslySetInnerHTML={{ __html: item.icon }} />
                                <div className="how-work-item__content">
                                    <h5 className="how-work-item__title">{item.title}</h5>
                                    <p className="how-work-item__desc">{item.content}</p>
                                </div>
                                <div className="how-work-item__shape"><HowWorkArrow /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
