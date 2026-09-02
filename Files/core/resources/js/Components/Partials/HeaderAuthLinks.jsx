import { Link } from '@inertiajs/react';

function AuthGroup({ label, loginHref, registerHref, dashboardHref, isLoggedIn }) {
    return (
        <div className="header-auth-group">
            <span className="header-auth-group__label">{label}</span>
            <div className="header-auth-group__links">
                {isLoggedIn ? (
                    <Link href={dashboardHref} className="header-auth-group__link header-auth-group__link--primary">
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link href={loginHref} className="header-auth-group__link">Sign In</Link>
                        <Link href={registerHref} className="header-auth-group__link header-auth-group__link--join">Join</Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default function HeaderAuthLinks({ routes, auth, compact = false }) {
    const customerLoggedIn = Boolean(auth?.buyer);
    const providerLoggedIn = Boolean(auth?.user);

    return (
        <div className={`header-auth-links${compact ? ' header-auth-links--compact' : ''}`}>
            <AuthGroup
                label="Customer"
                loginHref={routes.buyerLogin}
                registerHref={routes.buyerRegister}
                dashboardHref={routes.buyerHome}
                isLoggedIn={customerLoggedIn}
            />
            <span className="header-auth-links__divider" aria-hidden="true">|</span>
            <AuthGroup
                label="Provider"
                loginHref={routes.userLogin}
                registerHref={routes.userRegister}
                dashboardHref={routes.userHome}
                isLoggedIn={providerLoggedIn}
            />
        </div>
    );
}
