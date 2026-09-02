import { Link, usePage } from '@inertiajs/react';
import HeaderAuthLinks from '@/Components/Partials/HeaderAuthLinks';
import LanguageSwitcher from '@/Components/Partials/LanguageSwitcher';
import { isNavActive } from '@/utils/helpers';

export default function Header() {
    const { site, navigation, routes, auth, url } = usePage().props;
    const currentUrl = usePage().url || url || '';
    const pages = navigation?.pages || [];
    const usePagesDropdown = pages.length > 1;
    const postJobUrl = auth?.buyer ? routes.buyerJobPost : routes.postJob;

    const navClass = (href, exact = false) =>
        `nav-link${isNavActive(currentUrl, href, { exact }) ? ' active' : ''}`;

    return (
        <header className="header" id="header">
            <div className="container">
                <nav className="navbar navbar-expand-xl navbar-light">
                    <Link className="navbar-brand logo" href={routes.home}>
                        <img src={site.logo} alt={site.name} />
                    </Link>

                    <div className="d-xl-none d-block job-link">
                        <Link href={postJobUrl} className="btn btn--base btn--sm header-post-job-btn">
                            Post Job
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

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav nav-menu me-auto align-items-xl-center">
                            <li className={`nav-item${isNavActive(currentUrl, routes.home, { exact: true }) ? ' active' : ''}`}>
                                <Link className={navClass(routes.home, true)} href={routes.home}>Home</Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, routes.categories) ? ' active' : ''}`}>
                                <Link className={navClass(routes.categories)} href={routes.categories}>Categories</Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, routes.freelanceJobs) ? ' active' : ''}`}>
                                <Link className={navClass(routes.freelanceJobs)} href={routes.freelanceJobs}>Browse Requests</Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, routes.allFreelancers) ? ' active' : ''}`}>
                                <Link className={navClass(routes.allFreelancers)} href={routes.allFreelancers}>Find Providers</Link>
                            </li>
                            <li className="nav-item d-xl-none">
                                <Link className="nav-link fw-semibold text--base" href={postJobUrl}>Post Job</Link>
                            </li>

                            {usePagesDropdown ? (
                                <li className="nav-item dropdown">
                                    <a
                                        className="nav-link"
                                        href="#"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        Pages <span className="nav-item__icon"><i className="las la-angle-down"></i></span>
                                    </a>
                                    <ul className="dropdown-menu">
                                        {pages.map((page) => (
                                            <li key={page.id} className="dropdown-menu__list">
                                                <Link href={`/${page.slug}`} className={`dropdown-item dropdown-menu__link${isNavActive(currentUrl, `/${page.slug}`, { exact: true }) ? ' active' : ''}`}>
                                                    {page.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ) : (
                                pages.map((page) => (
                                    <li key={page.id} className={`nav-item${isNavActive(currentUrl, `/${page.slug}`, { exact: true }) ? ' active' : ''}`}>
                                        <Link className={navClass(`/${page.slug}`, true)} href={`/${page.slug}`}>{page.name}</Link>
                                    </li>
                                ))
                            )}

                            <li className={`nav-item${isNavActive(currentUrl, routes.blogs) ? ' active' : ''}`}>
                                <Link className={navClass(routes.blogs)} href={routes.blogs}>Blogs</Link>
                            </li>
                            <li className={`nav-item${isNavActive(currentUrl, routes.contact, { exact: true }) ? ' active' : ''}`}>
                                <Link className={navClass(routes.contact, true)} href={routes.contact}>Contact</Link>
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
                            <Link href={postJobUrl} className="btn btn--base header-post-job-btn">Post Job</Link>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
}
