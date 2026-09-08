import Slider from 'react-slick';
import QuoteIcon from '@/Components/Shared/QuoteIcon';

const testimonialSliderSettings = {
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: true,
    pauseOnHover: true,
    arrows: false,
    infinite: true,
    responsive: [
        {
            breakpoint: 768,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
            },
        },
    ],
};

export default function TestimonialSection({ data }) {
    if (!data.items?.length) return null;

    return (
        <section className="testimonials my-120">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-heading two text-center">
                            <h2 className="section-heading__title s-highlight" data-s-break="-1" data-s-length="1">
                                {data.heading}
                            </h2>
                            <p className="section-heading__desc">{data.subheading}</p>
                        </div>
                    </div>
                </div>
                <Slider className="testimonial-slider" {...testimonialSliderSettings}>
                    {data.items.map((item, index) => (
                        <div key={index} className="testimonails-card">
                            <div className="testimonial-item">
                                <span className="testimonial-item__icon">
                                    <QuoteIcon />
                                </span>
                                <p className="testimonial-item__desc">{item.quote}</p>
                                <div className="testimonial-item__info">
                                    <div className="testimonial-item__thumb">
                                        <img src={item.image} className="fit-image" alt={item.name} />
                                    </div>
                                    <div className="testimonial-item__details">
                                        <h6 className="testimonial-item__name">{item.name}</h6>
                                        <span className="testimonial-item__designation">
                                            From {item.country}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </section>
    );
}
