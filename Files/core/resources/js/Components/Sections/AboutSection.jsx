export default function AboutSection({ data }) {
    return (
        <div className="about-section my-120" id="about">
            <div className="container">
                <div className="row gy-4 align-items-center">
                    <div className="col-lg-5 pe-xl-5">
                        <div className="section-heading two">
                            <h4 className="section-heading__title text-start">{data.heading}</h4>
                        </div>
                        <div className="about-wrapper">
                            {data.elements?.map((item, index) => (
                                <div key={index} className="about-item">
                                    <span className="about-item__icon"><img src={item.image} alt="" /></span>
                                    <div className="about-item__content">
                                        <h5 className="about-item__title">{item.title}</h5>
                                        <p className="about-item__desc">{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="about-thumb-wrapper">
                            <div className="about-thumb-wrapper__shape"><img src={data.shape} alt="" /></div>
                            <div className="about-thumb"><img src={data.image} alt="" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
