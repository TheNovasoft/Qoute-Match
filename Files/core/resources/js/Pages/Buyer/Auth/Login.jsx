import { useForm } from '@inertiajs/react';
import AuthLayout, { AuthShell, AuthLogo, UserTypeSwitch } from '@/Components/Layout/AuthLayout';
import PasswordInput from '@/Components/Shared/PasswordInput';

export default function Login({ pageTitle, authContent }) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/customer/login');
    };

    return (
        <AuthLayout pageTitle={pageTitle}>
            <AuthShell
                left={{
                    shape: authContent.bannerShape,
                    image: authContent.image,
                }}
                right={
                    <>
                        <AuthLogo />
                        <form onSubmit={submit} className="loginForm">
                            <div className="account-form">
                                <UserTypeSwitch current="buyer" />
                                <p className="text">Welcome Back</p>
                                <h5 className="account-form__title">{authContent.heading}</h5>
                                <div className="row">
                                    <div className="col-12">
                                        <div className="form-group">
                                            <label htmlFor="username" className="form--label">Username or Email</label>
                                            <input type="text" id="username" className="form-control form--control"
                                                value={data.username} onChange={(e) => setData('username', e.target.value)} required />
                                            {errors.username && <small className="text-danger">{errors.username}</small>}
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="form-group">
                                            <label htmlFor="password" className="form--label">Password</label>
                                            <PasswordInput
                                                id="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                            />
                                            {errors.password && <small className="text-danger">{errors.password}</small>}
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="form-group">
                                            <div className="flex-between">
                                                <div className="form--check">
                                                    <input className="form-check-input" type="checkbox" id="remember"
                                                        checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                                                    <label className="form-check-label" htmlFor="remember">Remember Me</label>
                                                </div>
                                                <a href="/customer/password/reset" className="forgot-password">Forgot password?</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 form-group">
                                        <button type="submit" className="btn btn--base w-100" disabled={processing}>
                                            Login Account
                                        </button>
                                    </div>
                                </div>
                                <p className="account-form__text">
                                    Don't have on account yet?{' '}
                                    <a href="/customer/register" className="text--base">Create Account</a>
                                </p>
                            </div>
                        </form>
                    </>
                }
            />
        </AuthLayout>
    );
}
