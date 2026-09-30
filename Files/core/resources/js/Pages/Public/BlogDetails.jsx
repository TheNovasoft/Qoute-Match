import { Link } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import { useT } from '@/hooks/useT';

export default function BlogDetails({ pageTitle, seo, blog, latestBlogs, customPageTitle, customSubPageTitle, toRoute }) {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const t = useT();

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo} customPageTitle={customPageTitle}
            customSubPageTitle={customSubPageTitle} toRoute={toRoute}>
            <section className="blog-detials py-60">
                <div className="container">
                    <div className="row gy-5 justify-content-center">
                        <div className="col-xl-9 col-lg-8">
                            <div className="blog-details">
                                <div className="blog-details__thumb">
                                    <img src={blog.image} className="fit-image" alt="blog" />
                                </div>
                                <div className="blog-details__content">
                                    <span className="blog-item__date text--base mb-2">
                                        <span className="blog-item__date-icon"><i className="las la-clock"></i></span>
                                        {blog.date}
                                    </span>
                                    <h4 className="blog-details__title">{blog.title}</h4>
                                    <div className="blog-details__desc" dangerouslySetInnerHTML={{ __html: blog.description }} />
                                    <div className="blog-details__share mt-4 d-flex align-items-center flex-wrap justify-content-start">
                                        <h6 className="social-share__title mb-0 me-sm-3 me-1 d-inline-block">{t('Share')} :</h6>
                                        <ul className="social-list">
                                            <li className="social-list__item">
                                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} className="social-list__link flex-center" target="_blank" rel="noreferrer">
                                                    <i className="fab fa-facebook-f"></i>
                                                </a>
                                            </li>
                                            <li className="social-list__item">
                                                <a href={`https://twitter.com/share?url=${shareUrl}`} className="social-list__link flex-center" target="_blank" rel="noreferrer">
                                                    <i className="fa-brands fa-x-twitter"></i>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-lg-4">
                            <div className="blog-sidebar-wrapper">
                                <div className="blog-sidebar">
                                    <h5 className="blog-sidebar__title">{t('Latest Blogs')}</h5>
                                </div>
                                <div className="blog-sidebar">
                                    {latestBlogs?.length ? latestBlogs.map((item) => (
                                        <div key={item.slug} className="latest-blog">
                                            <Link href={item.url} className="latest-blog__thumb">
                                                <img src={item.image} className="fit-image" alt="" />
                                            </Link>
                                            <div className="latest-blog__content">
                                                <h6 className="latest-blog__title">
                                                    <Link href={item.url}>{item.shortTitle}</Link>
                                                </h6>
                                                <span className="latest-blog__date fs-13 text--base">
                                                    <i className="las la-clock"></i> {item.date}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <span className="latest-blog">Latest blog not found!</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
