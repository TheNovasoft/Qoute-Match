import FrontendLayout from '@/Components/Layout/FrontendLayout';

const customerFaq = [
    { q: 'How do I post a job?', a: 'Register or use guest post, describe your job in the step-by-step wizard, then publish. Providers will send you free quotes.' },
    { q: 'When do I pay?', a: 'When you accept a quote, your payment is held safely until work is complete and you approve it.' },
    { q: 'How do I compare quotes?', a: 'Open My Jobs, click the quote count, then compare prices, reviews, and profiles side by side.' },
    { q: 'Can I hire the same provider again?', a: 'Yes. On a completed project, use Hire Again to copy the job and invite the same provider.' },
    { q: 'What if something goes wrong?', a: 'Open a dispute from the project page. You and the provider can reply while our team reviews the case.' },
];

const providerFaq = [
    { q: 'How do I send a quote?', a: 'Complete your profile, browse Find Jobs, open a job, and click Send Your Quote.' },
    { q: 'What are quote tokens?', a: 'Some plans use quote tokens for new submissions. Buy tokens or subscribe for unlimited quotes when monetisation is enabled.' },
    { q: 'When do I get paid?', a: 'After the customer approves completed work, funds are released to your wallet minus platform fees.' },
    { q: 'What are service packages?', a: 'Fixed-price listings you create under My Service Packages so customers can see what you offer.' },
    { q: 'How do milestones work?', a: 'For larger jobs, customers can split payment into milestones. Mark each milestone complete and wait for approval.' },
];

export default function Faq({ pageTitle, seo }) {
    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <section className="py-5">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <h1 className="mb-2">Help & FAQ</h1>
                            <p className="text-muted mb-5">Quick answers for customers and providers.</p>

                            <h4 className="mb-3">For Customers</h4>
                            <div className="accordion mb-5" id="customerFaq">
                                {customerFaq.map((item, index) => (
                                    <div className="accordion-item" key={item.q}>
                                        <h2 className="accordion-header">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#customer-faq-${index}`}>
                                                {item.q}
                                            </button>
                                        </h2>
                                        <div id={`customer-faq-${index}`} className="accordion-collapse collapse" data-bs-parent="#customerFaq">
                                            <div className="accordion-body">{item.a}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h4 className="mb-3">For Providers</h4>
                            <div className="accordion" id="providerFaq">
                                {providerFaq.map((item, index) => (
                                    <div className="accordion-item" key={item.q}>
                                        <h2 className="accordion-header">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#provider-faq-${index}`}>
                                                {item.q}
                                            </button>
                                        </h2>
                                        <div id={`provider-faq-${index}`} className="accordion-collapse collapse" data-bs-parent="#providerFaq">
                                            <div className="accordion-body">{item.a}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
