import { useEffect } from 'react';
import AppLayout from '@/Components/Layout/AppLayout';
import Header from '@/Components/Partials/Header';
import Footer from '@/Components/Partials/Footer';
import Breadcrumb from '@/Components/Partials/Breadcrumb';

export default function FrontendLayout({
    children,
    pageTitle,
    seo,
    showBreadcrumb = true,
    customPageTitle,
    customSubPageTitle,
    toRoute,
    bodyClass = '',
}) {
    const themeClass = 'qm-fiverr-theme qm-home-fiverr';
    const mergedBodyClass = [themeClass, bodyClass].filter(Boolean).join(' ');

    useEffect(() => {
        if (!mergedBodyClass || typeof document === 'undefined') return undefined;
        const classes = [...new Set(mergedBodyClass.split(/\s+/).filter(Boolean))];
        classes.forEach((c) => document.body.classList.add(c));
        return () => {
            classes.forEach((c) => document.body.classList.remove(c));
        };
    }, [mergedBodyClass]);

    return (
        <AppLayout pageTitle={pageTitle} seo={seo}>
            <Header />

            <main>
                {showBreadcrumb && (
                    <Breadcrumb
                        pageTitle={pageTitle}
                        customPageTitle={customPageTitle}
                        customSubPageTitle={customSubPageTitle}
                        toRoute={toRoute}
                    />
                )}
                {children}
            </main>

            <Footer />
        </AppLayout>
    );
}
