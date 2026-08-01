import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import MasterLayout from '@/Components/Layout/MasterLayout';
import { initTemplateInteractions } from '@/utils/templateInteractions';

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
    });
}

function executeScripts(container) {
    if (!container) return;
    container.querySelectorAll('script').forEach((oldScript) => {
        const src = oldScript.getAttribute('src');
        // External libs are preloaded; skip re-injecting them so inline init runs immediately.
        if (src) {
            oldScript.remove();
            return;
        }
        const script = document.createElement('script');
        [...oldScript.attributes].forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.text = oldScript.textContent;
        oldScript.parentNode.replaceChild(script, oldScript);
    });
}

export default function GatewayCheckout({ layout = 'buyer', html, pageTitle, deposit, gateway }) {
    const ref = useRef(null);

    useEffect(() => {
        let cancelled = false;
        const jquerySrc = '/assets/global/js/jquery-3.7.1.min.js';

        const boot = async () => {
            try {
                if (!window.jQuery) {
                    await loadScriptOnce(jquerySrc);
                }
                // Stripe.js must load before Elements init scripts in gateway HTML
                if (typeof html === 'string' && html.includes('js.stripe.com') && !window.Stripe) {
                    await loadScriptOnce('https://js.stripe.com/v3/');
                }
            } catch {
                // gateway views may not need jQuery / Stripe.js
            }
            if (cancelled) return;
            executeScripts(ref.current);
            initTemplateInteractions();
        };

        boot();

        return () => {
            cancelled = true;
        };
    }, [html]);

    const content = (
        <div className="gateway-checkout-shell">
            {deposit?.amount && (
                <div className="alert alert-info mb-3">
                    {gateway?.name && (
                        <div className="small text-muted mb-1">Paying via <strong>{gateway.name}</strong></div>
                    )}
                    Confirming payment of <strong>{deposit.amount}</strong>
                    {deposit.finalAmount && <span className="ms-1">({deposit.finalAmount})</span>}
                    {deposit.trx && <span className="ms-2 text-muted small">Ref: {deposit.trx}</span>}
                </div>
            )}
            <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );

    const wrapped = layout === 'master' ? (
        <MasterLayout pageTitle={pageTitle}>{content}</MasterLayout>
    ) : (
        <BuyerMasterLayout pageTitle={pageTitle}>{content}</BuyerMasterLayout>
    );

    return (
        <>
            {pageTitle && <Head title={pageTitle} />}
            {wrapped}
        </>
    );
}
