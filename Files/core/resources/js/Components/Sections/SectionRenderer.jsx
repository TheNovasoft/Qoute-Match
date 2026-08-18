import { Link, usePage } from '@inertiajs/react';
import AboutSection from '@/Components/Sections/AboutSection';
import AccountSection from '@/Components/Sections/AccountSection';
import BlogSection from '@/Components/Sections/BlogSection';
import CategorySection from '@/Components/Sections/CategorySection';
import CompletionWorkSection from '@/Components/Sections/CompletionWorkSection';
import FacilitySection from '@/Components/Sections/FacilitySection';
import FaqSection from '@/Components/Sections/FaqSection';
import FindTaskSection from '@/Components/Sections/FindTaskSection';
import HowWorkSection from '@/Components/Sections/HowWorkSection';
import StaticPageSection from '@/Components/Sections/StaticPageSection';
import SubscribeSection from '@/Components/Sections/SubscribeSection';
import SupportSection from '@/Components/Sections/SupportSection';
import TestimonialSection from '@/Components/Sections/TestimonialSection';
import TopFreelancerSection from '@/Components/Sections/TopFreelancerSection';
import TrustSection from '@/Components/Sections/TrustSection';
import UserTypesSection from '@/Components/Sections/UserTypesSection';
import WhyChooseSection from '@/Components/Sections/WhyChooseSection';
import BrandSlider from '@/Components/Sections/BrandSlider';

const registry = {
    about: AboutSection,
    account: AccountSection,
    blog: BlogSection,
    category: CategorySection,
    completion_work: CompletionWorkSection,
    facility: FacilitySection,
    faq: FaqSection,
    for_customers: StaticPageSection,
    for_providers: StaticPageSection,
    pricing: StaticPageSection,
    trust_safety: StaticPageSection,
    find_task: FindTaskSection,
    how_work: HowWorkSection,
    subscribe: SubscribeSection,
    support: SupportSection,
    testimonial: TestimonialSection,
    top_freelancer: TopFreelancerSection,
    trust: TrustSection,
    user_types: UserTypesSection,
    why_choose: WhyChooseSection,
};

export default function SectionRenderer({ sections = [] }) {
    return sections.map((section, index) => {
        const Component = registry[section.key];
        if (!Component) return null;
        return <Component key={`${section.key}-${index}`} data={section.data} />;
    });
}

export function Banner({ data }) {
    const { routes, auth } = usePage().props;
    const postJobUrl = auth?.buyer ? routes.buyerJobPost : routes.postJob;

    if (!data) return null;

    return (
        <section className="banner-section">
            <div className="banner-section__shape">
                <img src={data.shape} alt="" />
            </div>
            <div className="container">
                <div className="row gy-5 align-items-start">
                    <div className="col-lg-6">
                        <div className="banner-content highlight">
                            <h1 className="banner-content__title s-highlight" data-s-break="-1" data-s-length="1">
                                {data.heading}
                            </h1>
                            <p className="banner-content__desc">{data.subheading}</p>
                        </div>
                        <div className="d-flex flex-wrap gap-3 align-items-center">
                            <Link href={postJobUrl} className="btn btn--base btn--lg">
                                Get Quotes
                            </Link>
                            <Link href={routes.forProviders} className="btn btn-outline--base btn--lg">
                                Join as Provider
                            </Link>
                        </div>
                        <div className="buyer-wrapper mt-4">
                            <span className="buyer-wrapper__title">{data.subtitle}</span>
                            <BrandSlider clients={data.clients} />
                        </div>
                    </div>
                    <div className="col-lg-6 d-xsm-block d-none">
                        <div className="banner-thumb-wrapper">
                            <div className="banner-thumb">
                                <img src={data.image} alt="" />
                            </div>
                            <div className="banner-thumb-wrapper__content">
                                <div className="banner-thumb-wrapper__item one">{data.featureOne}</div>
                                <div className="banner-thumb-wrapper__item two">{data.featureTwo}</div>
                                <div className="banner-thumb-wrapper__item three">
                                    <span className="icon"><img src={data.heartShape} alt="" /></span>
                                    <div className="content">
                                        <span className="text">{data.featureThree}</span>
                                        <ul className="rating-list">
                                            {[...Array(5)].map((_, i) => (
                                                <li key={i} className="rating-list__item"><i className="las la-star"></i></li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

import VerificationBadges from '@/Components/Shared/VerificationBadges';

export function FreelancerCard({ freelancer }) {
    return (
        <div className="freelancer-item">
            {freelancer.badge && (
                <span className="freelancer-item__status text--base fs-12">
                    <i className="las la-award"></i> {freelancer.badge.name}
                </span>
            )}
            <div className="freelancer-item__thumb">
                <img src={freelancer.image} alt={freelancer.fullname} />
            </div>
            <div className="freelancer-item__content">
                <VerificationBadges badges={freelancer.verificationBadges} compact className="justify-content-center mb-1" />
                <h6 className="freelancer-item__name">{freelancer.fullname}</h6>
                <span className="freelancer-item__designation">{freelancer.tagline}</span>
                {freelancer.avgRating > 0 && (
                    <ul className="text-list review-rating-list mb-0">
                        {[...Array(Math.min(Math.floor(freelancer.avgRating), 5))].map((_, i) => (
                            <li key={i} className="review-rating-list__item"><i className="las la-star"></i></li>
                        ))}
                        <li className="text-list__item">{freelancer.avgRating}/5</li>
                    </ul>
                )}
                <ul className="skill-list">
                    {freelancer.skills?.map((skill, index) => (
                        <li key={index} className="skill-list__item">
                            <span className="skill-list__link">{skill.name}</span>
                        </li>
                    ))}
                </ul>
                <div className="freelancer-item__btn">
                    <a href={freelancer.profileUrl} className="btn--base btn btn--sm">View Profile</a>
                </div>
            </div>
        </div>
    );
}
