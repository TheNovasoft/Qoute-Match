import { Link, usePage } from '@inertiajs/react';
import { useT } from '@/hooks/useT';

export default function Breadcrumb({ pageTitle, customPageTitle, customSubPageTitle, toRoute }) {
    const { routes } = usePage().props;
    const t = useT();
    const title = customPageTitle || pageTitle;

    return (
        <section className="breadcrumb breadcrumb-section bg-img">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="breadcrumb__wrapper">
                            <h3 className="breadcrumb__title">{t(title, title)}</h3>
                            <ul className="breadcrumb__list">
                                <li className="breadcrumb__item">
                                    <Link href={routes.home} className="breadcrumb__link">{t('Home')}</Link>
                                </li>
                                {customSubPageTitle && toRoute && (
                                    <>
                                        <li className="breadcrumb__item"><i className="fas fa-angle-right"></i></li>
                                        <li className="breadcrumb__item">
                                            <Link href={toRoute} className="breadcrumb__link">{t(customSubPageTitle, customSubPageTitle)}</Link>
                                        </li>
                                    </>
                                )}
                                <li className="breadcrumb__item"><i className="fas fa-angle-right"></i></li>
                                <li className="breadcrumb__item">
                                    <span className="breadcrumb__item-text">{t(title, title)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
