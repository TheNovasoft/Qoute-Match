import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import MasterLayout from '@/Components/Layout/MasterLayout';
import { initTemplateInteractions } from '@/utils/templateInteractions';

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        // Only count scripts we injected ourselves — inert tags from
        // dangerouslySetInnerHTML must not short-circuit loading.
        const existing = document.querySelector(`script[data-gateway-loader="${CSS.escape(src)}"]`);
        if (existing) {
            if (existing.dataset.loaded === '1' || (src.includes('js.stripe.com') && window.Stripe)) {
                resolve();
                return;
            }
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.gatewayLoader = src;
        script.onload = () => {
            script.dataset.loaded = '1';
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
    });
}

function executeScripts(container) {
    if (!container) return;
    container.querySelectorAll('script').forEach((oldScript) => {
        const src = oldScript.getAttribute('src');
        // External libs are preloaded; skip re-injecting them so inline init runs after.
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

async function ensureGatewayLibs(html) {
    if (!window.jQuery) {
        await loadScriptOnce('/assets/global/js/jquery-3.7.1.min.js');
    }

    const needsStripe =
        typeof html === 'string' &&
        (html.includes('js.stripe.com') || html.includes('publishable_key') || html.includes('client_secret'));

    if (needsStripe && !window.Stripe) {
        await loadScriptOnce('https://js.stripe.com/v3/');
        // Stripe.js attaches asynchronously to window in some environments
        const started = Date.now();
        while (!window.Stripe && Date.now() - started < 5000) {
            await new Promise((r) => setTimeout(r, 50));
        }
        if (!window.Stripe) {
            throw new Error('Stripe.js failed to initialize');
        }
    }
}

export default function GatewayCheckout({ layout = 'buyer', html, pageTitle, deposit, gateway }) {
    const ref = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            try {
                await ensureGatewayLibs(html);
            } catch (err) {
                console.error(err);
                if (!cancelled && ref.current) {
                    const box = ref.current.querySelector('#stripe-card-errors');
                    if (box) {
                        box.classList.remove('d-none');
                        box.textContent = 'Unable to load Stripe. Check your network and refresh.';
                    }
                }
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
