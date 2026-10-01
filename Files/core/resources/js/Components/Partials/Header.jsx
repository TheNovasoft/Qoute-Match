import { Link, usePage } from '@inertiajs/react';
import HeaderAuthLinks from '@/Components/Partials/HeaderAuthLinks';
import LanguageSwitcher from '@/Components/Partials/LanguageSwitcher';
import { isNavActive } from '@/utils/helpers';

export default function Header() {
    const { site, navigation, routes, auth, url } = usePage().props;
    const currentUrl = usePage().url || url || '';
    const aboutPage = navigation?.aboutPage;
    const extraPages = navigation?.extraPages || [];
    const extraLinks = navigation?.extraLinks || [];
    const postJobUrl = auth?.buyer ? routes.buyerJobPost : routes.postJob;
    const findJobsUrl = routes.freelanceJobs || '/freelance-jobs';
    const findProvidersUrl = routes.allFreelancers || '/providers';

    const aboutHref = aboutPage ? `/${aboutPage.slug}` : `${routes.home}#about`;
    const aboutLabel = aboutPage?.name || 'About';
    const hasExtraMenu = extraPages.length > 0 || extraLinks.length > 0;

    const navClass = (href, exact = false) =>
        `nav-link${isNavActive(currentUrl, href, { exact }) ? ' active' : ''}`;

    const isExtraActive = extraLinks.some((item) => isNavActive(currentUrl, item.href))
        || extraPages.some((page) => isNavActive(currentUrl, `/${page.slug}`, { exact: true }));

    const jobsActive = isNavActive(currentUrl, findJobsUrl) || isNavActive(currentUrl, '/jobs');

    return (
        <header className="header qm-site-header" id="header">
            <div className="container">
                <nav className="navbar navbar-expand-xl navbar-light header-navbar">
                    <Link className="navbar-brand logo" href={routes.home}>
                        <img src={site.logo} alt={site.name} />
                    </Link>

                    <div className="d-xl-none d-block job-link">
                        <Link href={postJobUrl} className="btn btn--base btn--sm header-post-job-btn">
                            Post a job
                        </Link>
                    </div>

                    <button
                        className="navbar-toggler header-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span id="hiddenNav">
                            <i className="las la-bars"></i>
                        </span>
                    </button>

                    <div className="collapse navbar-collapse justify-content-xl-center" id="navbarSupportedContent">
                        <ul className="navbar-nav nav-menu mx-xl-auto align-items-xl-center justify-content-xl-center">
                            <li className={`nav-item${isNavActive(currentUrl, routes.home, { exact: true }) ? ' active' : ''}`}>
                                <Link className={navClass(routes.home, true)} href={routes.home}>Home</Link>
                            </li>
                            <li className={`nav-item${jobsActive ? ' active' : ''}`}>
                                <Link className={`nav-link${jobsActive ? ' active' : ''}`} href={findJobsUrl}>
                                    Find jobs
                                </Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, findProvidersUrl) ? ' active' : ''}`}>
                                <Link className={navClass(findProvidersUrl)} href={findProvidersUrl}>
                                    Find providers
                                </Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, aboutHref, { exact: !aboutPage }) ? ' active' : ''}`}>
                                <Link className={navClass(aboutHref, !aboutPage)} href={aboutHref}>{aboutLabel}</Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, routes.categories) ? ' active' : ''}`}>
                                <Link className={navClass(routes.categories)} href={routes.categories}>Categories</Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, routes.contact, { exact: true }) ? ' active' : ''}`}>
                                <Link className={navClass(routes.contact, true)} href={routes.contact}>Contact</Link>
                            </li>

                            {hasExtraMenu && (
                                <li className={`nav-item dropdown${isExtraActive ? ' active' : ''}`}>
                                    <a
                                        className="nav-link"
                                        href="#"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        More <span className="nav-item__icon"><i className="las la-angle-down"></i></span>
                                    </a>
                                    <ul className="dropdown-menu">
                                        <li className="dropdown-menu__list">
                                            <Link
                                                href={routes.blogs}
                                                className={`dropdown-item dropdown-menu__link${isNavActive(currentUrl, routes.blogs) ? ' active' : ''}`}
                                            >
                                                Blogs
                                            </Link>
                                        </li>
                                        {extraLinks.map((item) => (
                                            <li key={item.href} className="dropdown-menu__list">
                                                <Link
                                                    href={item.href}
                                                    className={`dropdown-item dropdown-menu__link${isNavActive(currentUrl, item.href) ? ' active' : ''}`}
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        ))}
                                        {extraPages.map((page) => (
                                            <li key={page.id} className="dropdown-menu__list">
                                                <Link
                                                    href={`/${page.slug}`}
                                                    className={`dropdown-item dropdown-menu__link${isNavActive(currentUrl, `/${page.slug}`, { exact: true }) ? ' active' : ''}`}
                                                >
                                                    {page.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )}

                            {!hasExtraMenu && (
                                <li className={`nav-item${isNavActive(currentUrl, routes.blogs) ? ' active' : ''}`}>
                                    <Link className={navClass(routes.blogs)} href={routes.blogs}>Blogs</Link>
                                </li>
                            )}

                            <li className="nav-item d-xl-none">
                                <Link className="nav-link fw-semibold text--base" href={postJobUrl}>Post a job</Link>
                            </li>
                            <li className="nav-item d-xl-none w-100">
                                <LanguageSwitcher className="mb-3" />
                                <HeaderAuthLinks routes={routes} auth={auth} compact />
                            </li>
                        </ul>
                    </div>

                    <div className="d-xl-block d-none header-actions">
                        <div className="top-button d-flex align-items-center gap-3">
                            <LanguageSwitcher />
                            <HeaderAuthLinks routes={routes} auth={auth} />
                            <Link href={postJobUrl} className="btn btn--base header-post-job-btn">Post a job</Link>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
}
