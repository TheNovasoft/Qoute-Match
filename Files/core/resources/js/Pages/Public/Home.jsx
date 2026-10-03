import FrontendLayout from '@/Components/Layout/FrontendLayout';
import SectionRenderer, { Banner } from '@/Components/Sections/SectionRenderer';
import { useTemplateSliders } from '@/hooks/useTemplateSliders';

/** Home sections to hide (Popular Categories, dual CTA cards, Core User Types). */
const HIDDEN_HOME_SECTIONS = new Set(['category', 'account', 'user_types']);

export default function Home({ pageTitle, seo, sections, banner }) {
    const visibleSections = (sections || []).filter((section) => !HIDDEN_HOME_SECTIONS.has(section.key));
    useTemplateSliders([visibleSections]);

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo} showBreadcrumb={false}>
            <Banner data={banner} />
            <SectionRenderer sections={visibleSections} />
        </FrontendLayout>
    );
}
