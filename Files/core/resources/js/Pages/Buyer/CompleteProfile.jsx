import { useForm, usePage } from '@inertiajs/react';
import AuthLayout, { AuthShell, AuthLogo } from '@/Components/Layout/AuthLayout';

export default function CompleteProfile({ pageTitle, authContent, countries, suggestedUsername, defaultCountryCode, buyer }) {
    const { routes } = usePage().props;
    const defaultCountry = countries.find((c) => c.code === defaultCountryCode) || countries.find((c) => c.code === 'GB') || countries[0];

    const { data, setData, post, processing, errors } = useForm({
        username: buyer?.username || suggestedUsername || '',
        country: defaultCountry?.name || '',
        country_code: defaultCountry?.code || '',
        mobile_code: defaultCountry?.dialCode || '',
        mobile: buyer?.mobile || '',
        address: buyer?.address || '',
        state: buyer?.state || '',
        zip: buyer?.zip || '',
        city: buyer?.city || '',
    });

    const onCountryChange = (event) => {
        const selected = countries.find((c) => c.name === event.target.value);
        if (!selected) return;
        setData((current) => ({
            ...current,
            country: selected.name,
            country_code: selected.code,
            mobile_code: selected.dialCode,
        }));
    };

    const submit = (event) => {
        event.preventDefault();
        post(routes?.buyerDataSubmit ?? '/customer/customer-data-submit');
    };

    const errorMessages = Object.values(errors).flat();

    return (
        <AuthLayout pageTitle={pageTitle}>
            <AuthShell
                left={{ shape: authContent.bannerShape, image: authContent.image }}
                right={
                    <>
                        <AuthLogo />
                        <div className="account-form">
                            <p className="text">Almost there</p>
                            <h5 className="account-form__title">Complete Your Profile</h5>
                            <p className="mb-4">Add your location details to start posting quote requests.</p>

                            {errorMessages.length > 0 && (
                                <div className="alert alert-danger">
                                    <ul className="mb-0 ps-3">
                                        {errorMessages.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <div className="row">
                                    <div className="col-12 form-group">
                                        <label className="form--label">Username</label>
                                        <input
                                            type="text"
                                            className="form-control form--control"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value.toLowerCase())}
                                            required
                                        />
                                        <small className="text-muted d-block mt-1">
                                            Lowercase letters, numbers, and underscores only — not your email.
                                        </small>
                                        {errors.username && <small className="text-danger d-block">{errors.username}</small>}
                                    </div>

                                    <div className="col-md-6 form-group">
                                        <label className="form--label">Country</label>
                                        <select
                                            className="form-select form--control"
                                            value={data.country}
                                            onChange={onCountryChange}
                                            required
                                        >
                                            {countries.map((country) => (
                                                <option key={country.code} value={country.name}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.country && <small className="text-danger d-block">{errors.country}</small>}
                                        {errors.country_code && <small className="text-danger d-block">{errors.country_code}</small>}
                                    </div>

                                    <div className="col-md-6 form-group">
                                        <label className="form--label">Mobile</label>
                                        <div className="input-group">
                                            <span className="input-group-text">+{data.mobile_code}</span>
                                            <input
                                                type="text"
                                                className="form-control form--control"
                                                value={data.mobile}
                                                onChange={(e) => setData('mobile', e.target.value.replace(/\D/g, ''))}
                                                required
                                            />
                                        </div>
                                        {errors.mobile && <small className="text-danger d-block">{errors.mobile}</small>}
                                        {errors.mobile_code && <small className="text-danger d-block">{errors.mobile_code}</small>}
                                    </div>

                                    <div className="col-md-6 form-group">
                                        <label className="form--label">Address</label>
                                        <input
                                            type="text"
                                            className="form-control form--control"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                    </div>

                                    <div className="col-md-6 form-group">
                                        <label className="form--label">City</label>
                                        <input
                                            type="text"
                                            className="form-control form--control"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                        />
                                    </div>

                                    <div className="col-md-6 form-group">
                                        <label className="form--label">State</label>
                                        <input
                                            type="text"
                                            className="form-control form--control"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                        />
                                    </div>

                                    <div className="col-md-6 form-group">
                                        <label className="form--label">Zip Code</label>
                                        <input
                                            type="text"
                                            className="form-control form--control"
                                            value={data.zip}
                                            onChange={(e) => setData('zip', e.target.value)}
                                        />
                                    </div>

                                    <div className="col-12 form-group">
                                        <button type="submit" className="btn btn--base w-100" disabled={processing}>
                                            {processing ? 'Saving...' : 'Complete Profile'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </>
                }
            />
        </AuthLayout>
    );
}
