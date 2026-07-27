import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import Pagination from '@/Components/Shared/Pagination';

const WALLET_GATEWAY = 'wallet';

function gatewaySupportsPrice(gateways, selectedGateway, selectedCurrency, price) {
    if (!selectedGateway || !selectedCurrency || !gateways?.length) {
        return false;
    }

    const gate = gateways.find(
        (item) => String(item.method_code) === String(selectedGateway) && item.currency === selectedCurrency,
    );

    if (!gate) {
        return false;
    }

    return price >= gate.min_amount && price <= gate.max_amount;
}

function canPurchaseItem({ gateway, currency, price, gateways, walletBalance }) {
    if (!gateway || !currency) {
        return false;
    }

    if (gateway === WALLET_GATEWAY) {
        return walletBalance >= price;
    }

    return gatewaySupportsPrice(gateways, gateway, currency, price);
}

export default function LeadCredits({
    pageTitle,
    wallet = {},
    summary,
    packages = [],
    plans = [],
    gateways = [],
    setup = {},
    logs,
}) {
    const { routes } = usePage().props;
    const [payment, setPayment] = useState({ gateway: '', currency: '' });
    const [processing, setProcessing] = useState(false);

    const walletBalance = Number(wallet.balance ?? 0);
    const walletCurrency = wallet.currency || 'USD';
    const paymentMethods = [
        {
            method_code: WALLET_GATEWAY,
            name: 'Account wallet',
            currency: walletCurrency,
            label: `Account wallet (${wallet.balance_formatted || walletBalance} available)`,
            is_wallet: true,
        },
        ...gateways,
    ];

    const submitPurchase = (url, payload) => {
        if (!payment.gateway || !payment.currency) {
            return;
        }

        setProcessing(true);
        router.post(
            url,
            {
                ...payload,
                gateway: payment.gateway,
                currency: payment.currency,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const submitCredits = (packageId) => {
        submitPurchase(
            routes.userMonetisationCredits ?? '/provider/monetisation-payment/credits',
            { package_id: packageId },
        );
    };

    const submitPlan = (planId) => {
        submitPurchase(
            routes.userMonetisationSubscription ?? '/provider/monetisation-payment/subscription',
            { plan_id: planId },
        );
    };

    const showPackages = setup.credits_mode !== false && summary.credits_mode;
    const showPlans = setup.subscription_mode !== false && summary.subscription_mode;
    const hasPackages = packages.length > 0;
    const hasPlans = plans.length > 0;
    const hasExternalGateways = gateways.length > 0;
    const paymentSelected = Boolean(payment.gateway && payment.currency);
    const usingWallet = payment.gateway === WALLET_GATEWAY;
    const usingManualGateway = paymentSelected && !usingWallet;

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                <div className="dashboard-body-wrapper mt-4">
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="dashboard-card h-100">
                                <div className="dashboard-card__body">
                                    <span className="text-muted">Lead credits balance</span>
                                    <h3 className="mb-0">{summary.credits}</h3>
                                    {summary.credits_mode && (
                                        <p className="mb-0 small text-muted">
                                            {summary.quote_cost} credit(s) per new quote
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8">
                            <div className="dashboard-card h-100">
                                <div className="dashboard-card__body">
                                    {summary.unlimited_quotes ? (
                                        <p className="mb-0">
                                            <i className="las la-crown text--base"></i>{' '}
                                            Active subscription: <strong>{summary.subscription?.plan}</strong>
                                            {summary.subscription?.expires_at && (
                                                <> — expires {summary.subscription.expires_at}</>
                                            )}
                                        </p>
                                    ) : summary.subscription ? (
                                        <p className="mb-0">
                                            Subscription: {summary.subscription.plan} (expires {summary.subscription.expires_at})
                                        </p>
                                    ) : (
                                        <p className="mb-0 text-muted">
                                            Buy credit packs below to submit quotes, or ask your admin to grant welcome credits when your account is approved.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!hasExternalGateways && (hasPackages || hasPlans) && (
                        <div className="alert alert-info mb-4" role="alert">
                            Pay instantly from your <strong>account wallet</strong> ({wallet.balance_formatted}). External payment gateways can also be enabled under{' '}
                            <strong>Admin → Payment Gateways</strong>.
                        </div>
                    )}

                    {showPackages && !hasPackages && (
                        <div className="alert alert-warning mb-4" role="alert">
                            <strong>No credit packages available.</strong> Your site admin must add packages under{' '}
                            <strong>Admin → Monetisation → Credit Packages</strong>.
                        </div>
                    )}

                    {showPlans && !hasPlans && (
                        <div className="alert alert-info mb-4" role="alert">
                            No subscription plans are configured yet. Admin can add them under <strong>Monetisation → Subscription Plans</strong>.
                        </div>
                    )}

                    {!showPackages && !showPlans && (
                        <div className="alert alert-info mb-4" role="alert">
                            Monetisation mode is not set up for credit purchases. Admin should check <strong>Monetisation → Settings</strong> and choose credits, subscription, or both.
                        </div>
                    )}

                    {(hasPackages || hasPlans) && (
                        <div className="dashboard-card mb-4">
                            <div className="dashboard-card__body">
                                <label className="form-label">Payment method</label>
                                <select
                                    className="form-select form--control"
                                    value={payment.gateway ? `${payment.gateway}|${payment.currency}` : ''}
                                    onChange={(e) => {
                                        const [gateway, currency] = e.target.value.split('|');
                                        setPayment({ gateway: gateway || '', currency: currency || '' });
                                    }}
                                >
                                    <option value="">Select payment method</option>
                                    {paymentMethods.map((gate) => (
                                        <option
                                            key={`${gate.method_code}-${gate.currency}`}
                                            value={`${gate.method_code}|${gate.currency}`}
                                        >
                                            {gate.label || `${gate.name} (${gate.currency})`}
                                        </option>
                                    ))}
                                </select>
                                {usingWallet && (
                                    <p className="mb-0 mt-2 small text-muted">
                                        Credits are added immediately when you pay from your wallet balance.
                                    </p>
                                )}
                                {usingManualGateway && (
                                    <p className="mb-0 mt-2 small text-muted">
                                        Bank transfer and manual gateways require admin approval before credits are added.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {showPackages && hasPackages && (
                        <div className="mb-4">
                            <h5 className="mb-3">Credit packages</h5>
                            <div className="row g-3">
                                {packages.map((pkg) => {
                                    const canBuy = canPurchaseItem({
                                        gateway: payment.gateway,
                                        currency: payment.currency,
                                        price: pkg.price_raw,
                                        gateways,
                                        walletBalance,
                                    });

                                    return (
                                        <div key={pkg.id} className="col-md-4">
                                            <div className="dashboard-card h-100">
                                                <div className="dashboard-card__body d-flex flex-column">
                                                    <h6>{pkg.name}</h6>
                                                    <p className="mb-1">
                                                        <strong>{pkg.total_credits}</strong> credits
                                                        {pkg.bonus_credits > 0 && (
                                                            <span className="text-muted"> (incl. {pkg.bonus_credits} bonus)</span>
                                                        )}
                                                    </p>
                                                    <p className="h5 text--base">{pkg.price}</p>
                                                    {!canBuy && paymentSelected && usingWallet && (
                                                        <p className="small text-warning mb-2">
                                                            Insufficient wallet balance for this package.
                                                        </p>
                                                    )}
                                                    {!canBuy && paymentSelected && !usingWallet && (
                                                        <p className="small text-warning mb-2">
                                                            Selected gateway does not support this price range.
                                                        </p>
                                                    )}
                                                    {!paymentSelected && (
                                                        <p className="small text-muted mb-2">
                                                            Select a payment method above first.
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn btn--base btn-sm mt-auto"
                                                        disabled={processing || !canBuy}
                                                        onClick={() => submitCredits(pkg.id)}
                                                    >
                                                        {usingWallet ? 'Buy with wallet' : 'Buy credits'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {showPlans && hasPlans && (
                        <div className="mb-4">
                            <h5 className="mb-3">Subscription plans</h5>
                            <div className="row g-3">
                                {plans.map((plan) => {
                                    const canBuy = canPurchaseItem({
                                        gateway: payment.gateway,
                                        currency: payment.currency,
                                        price: plan.price_raw,
                                        gateways,
                                        walletBalance,
                                    });

                                    return (
                                        <div key={plan.id} className="col-md-4">
                                            <div className="dashboard-card h-100">
                                                <div className="dashboard-card__body d-flex flex-column">
                                                    <h6>{plan.name}</h6>
                                                    {plan.description && <p className="small text-muted">{plan.description}</p>}
                                                    <ul className="small mb-2">
                                                        <li>{plan.duration_days} days access</li>
                                                        {plan.unlimited_quotes && <li>Unlimited quote submissions</li>}
                                                        {plan.monthly_credits > 0 && <li>{plan.monthly_credits} bonus credits</li>}
                                                    </ul>
                                                    <p className="h5 text--base">{plan.price}</p>
                                                    {!canBuy && paymentSelected && usingWallet && (
                                                        <p className="small text-warning mb-2">
                                                            Insufficient wallet balance for this plan.
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn btn--base btn-sm mt-auto"
                                                        disabled={processing || !canBuy}
                                                        onClick={() => submitPlan(plan.id)}
                                                    >
                                                        {usingWallet ? 'Subscribe with wallet' : 'Subscribe'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {logs?.data?.length > 0 ? (
                        <div className="dashboard-card">
                            <div className="dashboard-card__header">
                                <h6 className="dashboard-card__title mb-0">Credit history</h6>
                            </div>
                            <div className="dashboard-card__body p-0">
                                <div className="table-responsive lead-credits-history">
                                    <table className="table table--responsive--md mb-0">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Credits</th>
                                                <th>Balance</th>
                                                <th>Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.data.map((log) => (
                                                <tr key={log.id}>
                                                    <td data-label="Date">{log.created_at}</td>
                                                    <td data-label="Credits" className={log.credits >= 0 ? 'text-success' : 'text-danger'}>
                                                        {log.credits >= 0 ? '+' : ''}{log.credits}
                                                    </td>
                                                    <td data-label="Balance">{log.balance_after}</td>
                                                    <td data-label="Note" className="text-capitalize">{log.remark}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {logs.links?.length > 3 && (
                                    <div className="p-3"><Pagination links={logs.links} /></div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-card">
                            <div className="dashboard-card__body text-muted">
                                No credit activity yet. Purchases and quote usage will appear here.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MasterLayout>
    );
}
