import { Link, usePage } from '@inertiajs/react';
import { quotePostUrl } from '@/utils/quotePostUrl';

const CORE_EXTRA_LABELS = new Set([
    'browse requests',
    'find providers',
    'find jobs',
    'freelance jobs',
]);

export default function Footer() {
    const { site, navigation, routes, auth, footerData: data = {} } = usePage().props;
    const postJobUrl = quotePostUrl(routes, auth);

    const extraLinks = (navigation?.extraLinks || []).filter((item) =>
        CORE_EXTRA_LABELS.has(String(item.label || '').toLowerCase())
    );

    const policies = (data.policies || []).filter((policy) => {
        const t = String(policy.title || '').toLowerCase();
        return t.includes('privacy') || t.includes('terms of service') || t === 'terms';
    }).slice(0, 3);

    return (
        <footer className="footer-area qm-footer">
            <div className="container">
                <div className="footer-wrapper qm-footer__grid py-4">
                    <div className="footer-item">
                        <h5 className="footer-item__title">Explore</h5>
                        <ul className="footer-menu">
                            <li className="footer-menu__item">
                                <Link href={routes.home} className="footer-menu__link">Home</Link>
                            </li>
                            <li className="footer-menu__item">
                                <Link
                                    href={navigation?.aboutPage ? `/${navigation.aboutPage.slug}` : `${routes.home}#about`}
                                    className="footer-menu__link"
                                >
                                    {navigation?.aboutPage?.name || 'About'}
                                </Link>
                            </li>
                            <li className="footer-menu__item">
                                <Link href={routes.categories} className="footer-menu__link">Categories</Link>
                            </li>
                            <li className="footer-menu__item">
                                <Link href={routes.contact} className="footer-menu__link">Contact</Link>
                            </li>
                            {extraLinks.map((item) => (
                                <li key={item.href} className="footer-menu__item">
                                    <Link href={item.href} className="footer-menu__link">{item.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer-item">
                        <h5 className="footer-item__title">Get Started</h5>
                        <ul className="footer-menu">
                            {auth?.user ? (
                                <li className="footer-menu__item">
                                    <Link href={routes.userHome} className="footer-menu__link">Provider Dashboard</Link>
                                </li>
                            ) : auth?.buyer ? (
                                <li className="footer-menu__item">
                                    <Link href={routes.buyerHome} className="footer-menu__link">Customer Dashboard</Link>
                                </li>
                            ) : (
                                <>
                                    <li className="footer-menu__item">
                                        <Link href={routes.buyerRegister} className="footer-menu__link">Join as Customer</Link>
                                    </li>
                                    <li className="footer-menu__item">
                                        <Link href={routes.userRegister} className="footer-menu__link">Join as Provider</Link>
                                    </li>
                                </>
                            )}
                            <li className="footer-menu__item">
                                <Link href={postJobUrl} className="footer-menu__link">Post a Requirement</Link>
                            </li>
                            {policies.map((policy) => (
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
                        <h5 className="footer-item__title">Contact</h5>
                        <ul className="footer-contact-menu qm-footer__contact">
                            {data.contact?.phone && (
                                <li className="footer-contact-menu__item">
                                    <div className="footer-contact-menu__item-icon"><i className="fas fa-phone"></i></div>
                                    <div className="footer-contact-menu__item-content">
                                        <a href={`tel:${data.contact.phone}`}>{data.contact.phone}</a>
                                    </div>
                                </li>
                            )}
                            {data.contact?.email && (
                                <li className="footer-contact-menu__item">
                                    <div className="footer-contact-menu__item-icon"><i className="fas fa-envelope"></i></div>
                                    <div className="footer-contact-menu__item-content">
                                        <a href={`mailto:${data.contact.email}`}>{data.contact.email}</a>
                                    </div>
                                </li>
                            )}
                        </ul>

                        {(data.socialIcons || []).length > 0 && (
                            <div className="social-list-wrapper mt-3">
                                <ul className="social-list">
                                    {(data.socialIcons || []).slice(0, 4).map((social, index) => (
                                        <li key={index} className="social-list__item">
                                            <a
                                                href={social.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                title={social.title}
                                                className="social-list__link flex-center"
                                                dangerouslySetInnerHTML={{ __html: social.icon }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bottom-footer py-3">
                <div className="container">
                    <div className="bottom-footer-text text-center">
                        Copyright &copy;{new Date().getFullYear()}{' '}
                        <Link href={routes.home}>{site.name}</Link>. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
