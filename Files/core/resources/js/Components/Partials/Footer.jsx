import { Link, usePage } from '@inertiajs/react';
import { quotePostUrl } from '@/utils/quotePostUrl';

export default function Footer() {
    const { site, navigation, routes, auth, footerData: data = {} } = usePage().props;
    const pages = navigation?.pages || [];
    const postJobUrl = quotePostUrl(routes, auth);

    return (
        <footer className="footer-area">
            <div className="container">
                <div className="footer-area__top">
                    <div className="sign-up-wrapper">
                        <div className="sign-up-content">
                            <h4 className="sign-up-content__title">
                                {data.account?.freelancerTitle}
                            </h4>
                            <p className="sign-up-content__desc">{data.account?.freelancerContent}</p>
                            <Link href={routes.userRegister} className="sign-up-content__btn btn btn--base">
                                {data.account?.freelancerButton}
                            </Link>
                        </div>
                        <div className="sign-up-content">
                            <h4 className="sign-up-content__title">
                                {data.account?.buyerTitle}
                            </h4>
                            <p className="sign-up-content__desc">{data.account?.buyerContent}</p>
                            <Link href={postJobUrl} className="sign-up-content__btn btn btn--base">
                                {data.account?.buyerButton}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="footer-wrapper py-60">
                    <div className="footer-item">
                        <h5 className="footer-item__title">Navigation</h5>
                        <ul className="footer-menu">
                            <li className="footer-menu__item"><Link href={routes.home} className="footer-menu__link">Home</Link></li>
                            <li className="footer-menu__item"><Link href={routes.categories} className="footer-menu__link">Categories</Link></li>
                            <li className="footer-menu__item"><Link href={routes.locations} className="footer-menu__link">Locations</Link></li>
                            <li className="footer-menu__item"><Link href={routes.freelanceJobs} className="footer-menu__link">Browse Requests</Link></li>
                            <li className="footer-menu__item"><Link href={routes.allFreelancers} className="footer-menu__link">Find Providers</Link></li>
                            {pages.map((page) => (
                                <li key={page.id} className="footer-menu__item">
                                    <Link href={`/${page.slug}`} className="footer-menu__link">{page.name}</Link>
                                </li>
                            ))}
                            <li className="footer-menu__item"><Link href={routes.blogs} className="footer-menu__link">Blogs</Link></li>
                            <li className="footer-menu__item"><Link href={routes.contact} className="footer-menu__link">Contact Us</Link></li>
                            <li className="footer-menu__item"><Link href={routes.faq ?? '/faq'} className="footer-menu__link">FAQ</Link></li>
                        </ul>
                    </div>

                    <div className="footer-item">
                        <h5 className="footer-item__title">Get Started</h5>
                        <ul className="footer-menu">
                            {auth?.user ? (
                                <li className="footer-menu__item"><Link href={routes.userHome} className="footer-menu__link">Provider Dashboard</Link></li>
                            ) : auth?.buyer ? (
                                <li className="footer-menu__item"><Link href={routes.buyerHome} className="footer-menu__link">Customer Dashboard</Link></li>
                            ) : (
                                <>
                                    <li className="footer-menu__item"><Link href={routes.buyerLogin} className="footer-menu__link">Customer Login</Link></li>
                                    <li className="footer-menu__item"><Link href={routes.userLogin} className="footer-menu__link">Provider Login</Link></li>
                                </>
                            )}
                            <li className="footer-menu__item"><Link href={postJobUrl} className="footer-menu__link">Post a Requirement</Link></li>
                        </ul>
                    </div>

                    <div className="footer-item">
                        <h5 className="footer-item__title">Terms</h5>
                        <ul className="footer-menu">
                            {(data.policies || []).map((policy) => (
                                <li key={policy.slug} className="footer-menu__item">
                                    <Link href={policy.url} className="footer-menu__link">{policy.title}</Link>
                                </li>
                            ))}
                            <li className="footer-menu__item">
                                <Link href={routes.cookiePolicy} className="footer-menu__link">Cookie Policy</Link>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-item">
                        <h5 className="footer-item__title">Contact Us</h5>
                        <ul className="footer-contact-menu">
                            <li className="footer-contact-menu__item">
                                <div className="footer-contact-menu__item-icon"><i className="fas fa-map-marker-alt"></i></div>
                                <div className="footer-contact-menu__item-content"><p>{data.contact?.details}</p></div>
                            </li>
                            <li className="footer-contact-menu__item">
                                <div className="footer-contact-menu__item-icon"><i className="fas fa-phone"></i></div>
                                <div className="footer-contact-menu__item-content">
                                    <a href={`tel:${data.contact?.phone}`}>{data.contact?.phone}</a>
                                </div>
                            </li>
                            <li className="footer-contact-menu__item">
                                <div className="footer-contact-menu__item-icon"><i className="fas fa-envelope"></i></div>
                                <div className="footer-contact-menu__item-content">
                                    <a href={`mailto:${data.contact?.email}`}>{data.contact?.email}</a>
                                </div>
                            </li>
                        </ul>

                        <div className="social-list-wrapper">
                            <p className="title">Follow Us</p>
                            <ul className="social-list">
                                {(data.socialIcons || []).map((social, index) => (
                                    <li key={index} className="social-list__item">
                                        <a href={social.url} target="_blank" rel="noreferrer" title={social.title}
                                            className="social-list__link flex-center" dangerouslySetInnerHTML={{ __html: social.icon }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bottom-footer py-3">
                <div className="container">
                    <div className="row gy-3">
                        <div className="col-md-12 text-center">
                            <div className="bottom-footer-text">
                                Copyright &copy;{new Date().getFullYear()}{' '}
                                <Link href={routes.home}>{site.name}</Link> All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
