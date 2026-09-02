import { useForm, usePage } from '@inertiajs/react';
import AuthLayout, { AuthShell, AuthLogo, RegisterTypeSwitch } from '@/Components/Layout/AuthLayout';

export default function Register({ pageTitle, authContent, registrationEnabled, requireAgree, policies, prefill = {} }) {
    const { site, routes } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        firstname: prefill.firstname || '',
        lastname: prefill.lastname || '',
        email: prefill.email || '',
        password: '',
        password_confirmation: '',
        customer_type: 'individual',
        company_name: '',
        phone: prefill.phone || '',
        agree: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post(routes.buyerRegister);
    };

    return (
        <AuthLayout pageTitle={pageTitle}>
            <AuthShell
                left={{ shape: authContent.bannerShape, image: authContent.image }}
                right={
                    <>
                        <AuthLogo />
                        <form onSubmit={submit} className="registerForm">
                            <div className="account-form">
                                <RegisterTypeSwitch current="customer" />
                                <p className="text">Welcome to {site.name}</p>
                                <h5 className="account-form__title">{authContent.heading}</h5>

                                <div className={registrationEnabled ? '' : 'form-disabled p-3'}>
                                    <div className="row">
                                        <div className="col-sm-12 form-group">
                                            <label className="form--label">Account Type</label>
                                            <div className="d-flex gap-4">
                                                <label className="form--check">
                                                    <input type="radio" name="customer_type" className="form-check-input"
                                                        checked={data.customer_type === 'individual'}
                                                        onChange={() => setData('customer_type', 'individual')} />
                                                    Individual
                                                </label>
                                                <label className="form--check">
                                                    <input type="radio" name="customer_type" className="form-check-input"
                                                        checked={data.customer_type === 'business'}
                                                        onChange={() => setData('customer_type', 'business')} />
                                                    Business
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-sm-6 form-group">
                                            <label htmlFor="firstname" className="form--label">First Name</label>
                                            <input type="text" id="firstname" className="form-control form--control"
                                                value={data.firstname} onChange={(e) => setData('firstname', e.target.value)} required />
                                            {errors.firstname && <small className="text-danger">{errors.firstname}</small>}
                                        </div>
                                        <div className="col-sm-6 form-group">
                                            <label htmlFor="lastname" className="form--label">Last Name</label>
                                            <input type="text" id="lastname" className="form-control form--control"
                                                value={data.lastname} onChange={(e) => setData('lastname', e.target.value)} required />
                                            {errors.lastname && <small className="text-danger">{errors.lastname}</small>}
                                        </div>
                                        {data.customer_type === 'business' && (
                                            <div className="col-sm-12 form-group">
                                                <label htmlFor="company_name" className="form--label">Company Name</label>
                                                <input type="text" id="company_name" className="form-control form--control"
                                                    value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} required />
                                                {errors.company_name && <small className="text-danger">{errors.company_name}</small>}
                                            </div>
                                        )}
                                        <div className="col-sm-6 form-group">
                                            <label htmlFor="phone" className="form--label">Phone (optional)</label>
                                            <input type="text" id="phone" className="form-control form--control"
                                                value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                        </div>
                                        <div className="col-sm-12 form-group">
                                            <label htmlFor="email" className="form--label">Email Address</label>
                                            <input type="email" id="email" className="form-control form--control"
                                                value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                            {errors.email && <small className="text-danger">{errors.email}</small>}
                                        </div>
                                        <div className="col-sm-6 form-group">
                                            <label htmlFor="password" className="form--label">Password</label>
                                            <input id="password" type="password" className="form-control form--control"
                                                value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                            {errors.password && <small className="text-danger">{errors.password}</small>}
                                        </div>
                                        <div className="col-sm-6 form-group">
                                            <label htmlFor="password_confirmation" className="form--label">Confirm Password</label>
                                            <input id="password_confirmation" type="password" className="form-control form--control"
                                                value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                                        </div>

                                        {requireAgree && (
                                            <div className="col-sm-12 form-group form--check mb-2 flex-nowrap">
                                                <input type="checkbox" className="form-check-input" id="agree"
                                                    checked={data.agree} onChange={(e) => setData('agree', e.target.checked)} required />
                                                <label htmlFor="agree" className="mx-2">
                                                    I agree with{' '}
                                                    {policies.map((policy, index) => (
                                                        <span key={policy.slug}>
                                                            <a href={policy.url} target="_blank" rel="noreferrer">{policy.title}</a>
                                                            {index < policies.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                </label>
                                            </div>
                                        )}

                                        <div className="col-sm-12 form-group">
                                            <button type="submit" className="btn btn--base w-100" disabled={processing || !registrationEnabled}>
                                                Register as Customer
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="account-form__text">
                                    Already have an account?{' '}
                                    <a href={routes.buyerLogin} className="text--base">Login Now</a>
                                </p>
                            </div>
                        </form>
                    </>
                }
            />
        </AuthLayout>
    );
}
