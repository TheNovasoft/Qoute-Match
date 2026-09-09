import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import RequestFormFields from '@/Components/Jobs/RequestFormFields';
import FriendlyErrorAlert from '@/Components/Shared/FriendlyErrorAlert';

export default function DepositMethods({ gateways, storeUrl, currencySymbol, currencyText, depositUrl, savedMethods = [] }) {
    const defaultIndex = savedMethods.find((method) => method.isDefault)
        ? gateways.findIndex((gateway) => savedMethods.some((method) => method.isDefault && method.methodCode === gateway.methodCode && method.currency === gateway.currency))
        : 0;
    const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const selected = gateways[selectedIndex] ?? gateways[0];

    const calculation = useMemo(() => {
        const value = parseFloat(amount) || 0;
        if (!selected || !value) {
            return { charge: 0, payable: 0 };
        }
        const charge = Number(selected.fixedCharge || 0) + (value * Number(selected.percentCharge || 0)) / 100;
        return { charge, payable: value + charge };
    }, [amount, selected]);

    const amountValue = parseFloat(amount);
    const amountInRange =
        amount !== '' &&
        !Number.isNaN(amountValue) &&
        !!selected &&
        amountValue >= Number(selected.minAmount) &&
        amountValue <= Number(selected.maxAmount);

    const submit = (event) => {
        event.preventDefault();
        setError('');

        if (!selected) {
            setError('Select a payment method.');
            return;
        }
        if (!storeUrl) {
            setError('We could not start your deposit. Reload this page and try again.');
            return;
        }
        if (!amountInRange) {
            setError(
                `Enter an amount between ${selected.minAmountFormatted} and ${selected.maxAmountFormatted}.`,
            );
            return;
        }
        if (processing) return;

        setProcessing(true);
        router.post(
            storeUrl,
            {
                gateway: selected.methodCode,
                currency: selected.currency,
                amount: String(amount).trim(),
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    const firstError = errors.amount || errors.gateway || errors.currency || errors.error || Object.values(errors)[0];
                    setError(firstError || 'We could not start your deposit. Check the amount and payment method, then try again.');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (!gateways.length) {
        return (
            <div className="alert alert-warning mb-0">
                No deposit methods are configured yet. Ask admin to add a payment gateway.
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="deposit-form">
            {error && (
                <FriendlyErrorAlert
                    message={error}
                    routes={{ buyerDeposit: depositUrl, userDeposit: depositUrl }}
                    onDismiss={() => setError('')}
                />
            )}
            {savedMethods.length > 0 && (
                <div className="card custom--card mb-4">
                    <div className="card-body">
                        <h6 className="mb-3">Saved payment methods</h6>
                        <div className="d-flex flex-wrap gap-2">
                            {savedMethods.map((method) => {
                                const gatewayIndex = gateways.findIndex(
                                    (gateway) => gateway.methodCode === method.methodCode && gateway.currency === method.currency,
                                );
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        className={`btn btn-sm ${gatewayIndex === selectedIndex ? 'btn--base' : 'btn-outline--base'}`}
                                        onClick={() => gatewayIndex >= 0 && setSelectedIndex(gatewayIndex)}
                                        disabled={gatewayIndex < 0}
                                    >
                                        {method.label}
                                        {method.isDefault ? ' (default)' : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            <div className="gateway-card">
                <div className="row justify-content-center gy-sm-4 gy-3">
                    <div className="col-xl-6">
                        <div className="payment-system-list is-scrollable gateway-option-list">
                            {gateways.map((gateway, index) => (
                                <label
                                    key={`${gateway.methodCode}-${gateway.currency}`}
                                    className={`payment-item gateway-option ${selectedIndex === index ? 'active' : ''}`}
                                >
                                    <div className="payment-item__info">
                                        <span className="payment-item__check" />
                                        <span className="payment-item__name">{gateway.name}</span>
                                    </div>
                                    <div className="payment-item__thumb">
                                        <img className="payment-item__thumb-img" src={gateway.image} alt="" />
                                    </div>
                                    <input
                                        type="radio"
                                        className="payment-item__radio gateway-input"
                                        name="gateway_option"
                                        value={`${gateway.methodCode}|${gateway.currency}`}
                                        checked={selectedIndex === index}
                                        onChange={() => setSelectedIndex(index)}
                                        hidden
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="col-xl-6">
                        <div className="payment-system-list deposit-panel">
                            <p className="deposit-panel__eyebrow">Deposit Summary</p>
                            <h5 className="deposit-panel__heading">How much would you like to add?</h5>
                            <label className="deposit-panel__label" htmlFor="deposit-amount">
                                Amount
                            </label>
                            <div className="deposit-amount-field">
                                <span className="deposit-amount-field__prefix">{currencySymbol}</span>
                                <input
                                    id="deposit-amount"
                                    className="deposit-amount-field__input amount form--control"
                                    type="text"
                                    inputMode="decimal"
                                    name="amount"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="0.00"
                                    autoComplete="off"
                                />
                                <span className="deposit-amount-field__suffix">{currencyText}</span>
                            </div>
                            <ul className="deposit-panel__meta">
                                <li>
                                    <span>Limit</span>
                                    <strong>
                                        {selected ? `${selected.minAmountFormatted} - ${selected.maxAmountFormatted}` : '—'}
                                    </strong>
                                </li>
                                <li>
                                    <span>Processing Charge</span>
                                    <strong>
                                        {currencySymbol}
                                        {calculation.charge.toFixed(2)} {currencyText}
                                    </strong>
                                </li>
                            </ul>
                            <div className="deposit-panel__total">
                                <span className="deposit-panel__total-label">Total Payable</span>
                                <strong className="deposit-panel__total-value">
                                    {currencySymbol}
                                    {calculation.payable.toFixed(2)} {currencyText}
                                </strong>
                            </div>
                            <button
                                type="submit"
                                className="btn btn--base w-100 deposit-panel__submit"
                                disabled={processing}
                            >
                                {processing ? 'Processing…' : 'Confirm Deposit'}
                            </button>
                            {selected?.name && (
                                <p className="small text-muted text-center mt-2 mb-0">
                                    Paying with <strong>{selected.name}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

export function ManualPaymentConfirm({ payment }) {
    const [fieldValues, setFieldValues] = useState({});
    const [processing, setProcessing] = useState(false);

    const submit = (event) => {
        event.preventDefault();
        const data = new FormData();
        Object.entries(fieldValues).forEach(([key, value]) => {
            if (value instanceof File) {
                data.append(key, value);
            } else if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach((item) => data.append(`${key}[]`, item));
                } else {
                    data.append(key, value);
                }
            }
        });
        // Post FormData directly — transform(() => Object.fromEntries(...)) drops File
        // values and can return undefined, which silently breaks manual/bank submits.
        setProcessing(true);
        router.post(payment.submitUrl, data, {
            forceFormData: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="card custom--card">
            <div className="card-body">
                <div className="alert alert-primary">
                    You are requesting <b>{payment.amount}</b>{' '}
                    {payment.isProviderMonetisation ? 'to purchase lead credits.' : 'to deposit.'}{' '}
                    Please pay <b>{payment.finalAmount}</b> for successful payment.
                </div>
                {payment.description && (
                    <div className="mb-3" dangerouslySetInnerHTML={{ __html: payment.description }} />
                )}
                <form onSubmit={submit} encType="multipart/form-data">
                    <RequestFormFields
                        fields={payment.fields}
                        values={fieldValues}
                        onChange={(label, value) => setFieldValues((prev) => ({ ...prev, [label]: value }))}
                    />
                    <button type="submit" className="btn btn--base w-100 mt-3" disabled={processing}>
                        {processing ? 'Processing…' : 'Pay Now'}
                    </button>
                </form>
            </div>
        </div>
    );
}
