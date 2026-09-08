import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { applyHighlights } from '@/utils/helpers';
import { formatToastMessage } from '@/utils/friendlyMessages';
import { initTemplateSliders } from '@/utils/sliders';
import { initTemplateInteractions, patchBootstrapModalBridge } from '@/utils/templateInteractions';
import NotifyScripts from '@/Components/Shared/NotifyScripts';
import CookieBanner from '@/Components/Shared/CookieBanner';

export default function AppLayout({ children, pageTitle, seo, showPreloader = true }) {
    const { site, template, seoDefaults, flash, errors, routes } = usePage().props;

    useEffect(() => {
        applyHighlights();
    }, [pageTitle]);

    useEffect(() => {
        if (typeof window.triggerToaster !== 'function') return;

        (flash?.notify || []).forEach(([status, message]) => {
            const formatted = formatToastMessage(status, message, routes || {});
            window.triggerToaster(status, formatted.message, formatted.title);
        });

        Object.values(errors || {}).flat().forEach((message) => {
            const formatted = formatToastMessage('error', message, routes || {});
            window.triggerToaster('error', formatted.message, formatted.title);
        });
    }, [flash, errors, routes]);

    useEffect(() => {
        // main.js hides preloader on window load, but that event fires before React mounts.
        const hidePreloader = () => {
            document.querySelectorAll('.preloader').forEach((el) => {
                el.style.display = 'none';
            });
        };
        hidePreloader();
        window.addEventListener('load', hidePreloader);
        return () => window.removeEventListener('load', hidePreloader);
    }, []);

    useEffect(() => {
        const scripts = [
            '/assets/global/js/jquery-3.7.1.min.js',
            '/assets/global/js/bootstrap.bundle.min.js',
            `${template.assetPath}js/slick.min.js`,
            `${template.assetPath}js/main.js`,
        ];

        const loadScript = (src) =>
            new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });

        scripts
            .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
            .then(() => {
            patchBootstrapModalBridge();
            applyHighlights();
            initTemplateSliders();
            initTemplateInteractions();
            window.setTimeout(() => initTemplateSliders(), 100);
        });
    }, [template.assetPath, pageTitle]);

    useEffect(() => {
        initTemplateInteractions();
    }, [pageTitle]);

    const title = pageTitle ? `${site.name} | ${pageTitle}` : site.name;
    const description = seo?.description || seoDefaults?.description;
    const keywords = Array.isArray(seo?.keywords || seoDefaults?.keywords)
        ? (seo?.keywords || seoDefaults?.keywords).join(', ')
        : seo?.keywords || seoDefaults?.keywords;
    const image = seo?.image || seoDefaults?.image;
    const canonical = seo?.canonical;

    return (
        <>
            <Head title={title}>
                {description && <meta name="description" content={description} />}
                {keywords && <meta name="keywords" content={keywords} />}
                {canonical && <link rel="canonical" href={canonical} />}
                {description && <meta property="og:description" content={description} />}
                {title && <meta property="og:title" content={title} />}
                {canonical && <meta property="og:url" content={canonical} />}
                {image && <meta property="og:image" content={image} />}
                <link rel="shortcut icon" href={site.favicon} type="image/x-icon" />
            </Head>

            {showPreloader && (
                <div className="preloader">
                    <div className="loader-p"></div>
                </div>
            )}

            <div className="body-overlay"></div>
            <div className="sidebar-overlay"></div>
            <a className="scroll-top" href="#">
                <i className="fas fa-angle-double-up"></i>
            </a>

            {children}

            <NotifyScripts />
            <CookieBanner />
        </>
    );
}
