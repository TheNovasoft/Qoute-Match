import { Link } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import SectionRenderer from '@/Components/Sections/SectionRenderer';
import { useT } from '@/hooks/useT';

export default function Blogs({ pageTitle, seo, sections, blogs }) {
    const t = useT();

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <section className="container py-120">
                <div className="row gy-4 justify-content-center">
                    {blogs.data?.length ? blogs.data.map((blog) => (
                        <div key={blog.id} className="col-xl-4 col-sm-6">
                            <Link href={blog.url} className="blog-item">
                                <div className="blog-item__thumb">
                                    <img src={blog.image} className="fit-image" alt="" />
                                </div>
                                <div className="blog-item__content">
                                    <h6 className="blog-item__title">{blog.title}</h6>
                                    <ul className="text-list flex-align">
                                        <li className="text-list__item">{blog.date}</li>
                                    </ul>
                                </div>
                            </Link>
                        </div>
                    )) : (
                        <div className="d-flex flex-column justify-content-center align-items-center">
                            <div className="text-center">
                                <h6 className="text-muted mt-3">{t('Blogs not found')}</h6>
                            </div>
                        </div>
                    )}
                </div>
                {sections?.length > 0 && (
                    <div className="pt-120">
                        <SectionRenderer sections={sections} />
                    </div>
                )}
            </section>
        </FrontendLayout>
    );
}
