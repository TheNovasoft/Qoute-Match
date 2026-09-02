import FrontendLayout from '@/Components/Layout/FrontendLayout';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';

function FlowIntro() {
    return (
        <div className="post-job-flow-intro text-center mb-4">
            <h1 className="post-job-flow-intro__title mb-2">Tell us what you need done</h1>
            <p className="post-job-flow-intro__text mb-0 text-muted">
                Answer a few questions — your previous answers stay visible below and can be edited anytime.
            </p>
        </div>
    );
}

function WizardIntro() {
    return (
        <div className="post-job-wizard-intro text-center mb-4">
            <h1 className="post-job-wizard-intro__title mb-2">Post a job</h1>
            <p className="post-job-wizard-intro__text mb-0 text-muted">
                Answer one question at a time — choose your option, then tap Next.
            </p>
        </div>
    );
}

export default function JobPostShell({ children, pageTitle, guestMode = false, wizard = false, flow = false }) {
    const sectionClass = flow ? ' post-job-section--flow' : wizard ? ' post-job-section--wizard' : '';
    const containerClass = flow || wizard ? 'container container--narrow' : 'container';

    if (guestMode) {
        return (
            <FrontendLayout pageTitle={pageTitle}>
                <section className={`post-job-section py-5${sectionClass}`}>
                    <div className={containerClass}>
                        {!wizard && !flow && (
                            <div className="post-job-hero mb-4">
                                <p className="post-job-hero__eyebrow mb-2">Free to post</p>
                                <h1 className="post-job-hero__title mb-2">Post your job and get quotes</h1>
                                <p className="post-job-hero__text mb-0 text-muted">
                                    No login required. Tell us what you need, compare quotes from verified providers, and hire with confidence.
                                </p>
                            </div>
                        )}
                        {flow && <FlowIntro />}
                        {wizard && <WizardIntro />}
                        {children}
                    </div>
                </section>
            </FrontendLayout>
        );
    }

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            {flow || wizard ? (
                <section className={`post-job-section${sectionClass} py-4`}>
                    <div className="container container--narrow px-0">
                        {flow && <FlowIntro />}
                        {wizard && <WizardIntro />}
                        {children}
                    </div>
                </section>
            ) : (
                children
            )}
        </BuyerMasterLayout>
    );
}
