import FrontendLayout from '@/Components/Layout/FrontendLayout';
import SectionRenderer from '@/Components/Sections/SectionRenderer';
import VideoPromoSection from '@/Components/Sections/VideoPromoSection';
import ForProvidersDesigns from '@/Pages/Public/ForProvidersDesigns';
import { useTemplateSliders } from '@/hooks/useTemplateSliders';
import { usePage } from '@inertiajs/react';

function isAboutPage(pageTitle, url = '') {
    const title = String(pageTitle || '').toLowerCase();
    const path = String(url || '').toLowerCase();
    return title.includes('about') || /(^|\/)about(\/|$|\?)/.test(path);
}

function isForProvidersPage(pageTitle, url = '') {
    const title = String(pageTitle || '').toLowerCase();
    const path = String(url || '').toLowerCase();
    return title.includes('provider') || path.includes('for-providers');
}

export default function CmsPage({ pageTitle, seo, sections }) {
    const page = usePage();
    const { routes } = page.props;
    const aboutHero = isAboutPage(pageTitle, page.url);
    const forProviders = isForProvidersPage(pageTitle, page.url);

    const providerData = (sections || []).find((s) => s.key === 'for_providers')?.data || {};
    const visibleSections = forProviders
        ? (sections || []).filter((s) => s.key !== 'for_providers')
        : sections;

    useTemplateSliders([visibleSections]);

    return (
        <FrontendLayout
            pageTitle={pageTitle}
            seo={seo}
            showBreadcrumb={!aboutHero && !forProviders}
            bodyClass={aboutHero || forProviders ? 'qm-fiverr-theme' : ''}
        >
            {aboutHero && (
                <VideoPromoSection
                    className="qm-video-promo--hero"
                    videoSrc="/assets/templates/basic/videos/qm-about-hero.mp4"
                    eyebrow="About QuoteMatch"
                    title="Built to connect customers with trusted providers"
                    description="We help you compare quotes from verified builders and freight forwarders — openly, fairly, and with confidence."
                    ctaLabel="Join as customer"
                    ctaHref={routes?.buyerRegister}
                />
            )}
            {forProviders && <ForProvidersDesigns data={providerData} />}
            <SectionRenderer sections={visibleSections} />
        </FrontendLayout>
    );
}
