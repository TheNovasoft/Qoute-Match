import AppLayout from '@/Components/Layout/AppLayout';
import { AuthorizationPanel, ResetCodeVerifyForm } from '@/Components/Auth/AuthorizationForms';
import ForgotPasswordForm from '@/Components/Auth/ForgotPasswordForm';
import ResetPasswordForm from '@/Components/Auth/ResetPasswordForm';
import DepositMethods, { ManualPaymentConfirm } from '@/Components/Shared/DepositMethods';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import MasterLayout from '@/Components/Layout/MasterLayout';
import { usePage } from '@inertiajs/react';

function AuthShell({ pageTitle, children }) {
    return (
        <AppLayout pageTitle={pageTitle}>
            <div className="account-section my-60">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-7 col-xl-5">{children}</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export function ForgotPasswordPage({ pageTitle, ...props }) {
    return <AuthShell pageTitle={pageTitle}><ForgotPasswordForm {...props} /></AuthShell>;
}

export function VerifyResetCodePage({ pageTitle, ...props }) {
    return (
        <AppLayout pageTitle={pageTitle}>
            <div className="account-section my-60">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-7 col-xl-5">
                            <ResetCodeVerifyForm {...props} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export function ResetPasswordPage({ pageTitle, ...props }) {
    return <AuthShell pageTitle={pageTitle}><ResetPasswordForm {...props} /></AuthShell>;
}

export function AuthorizationPage({ pageTitle, authz }) {
    return (
        <AppLayout pageTitle={pageTitle}>
            <div className="user-data-section">
                <div className="container">
                    <div className="user-data-section__content">
                        <div className="d-flex justify-content-center mx-auto">
                            <AuthorizationPanel authz={authz} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export function DepositPage({ pageTitle, gateways, storeUrl, role = 'buyer' }) {
    const { site, routes } = usePage().props;
    const Layout = role === 'buyer' ? BuyerMasterLayout : MasterLayout;
    const depositUrl = role === 'buyer'
        ? (routes?.buyerDeposit ?? '/customer/deposit')
        : (routes?.userDeposit ?? '/provider/deposit');

    return (
        <Layout pageTitle={pageTitle}>
            <DepositMethods
                gateways={gateways}
                storeUrl={storeUrl}
                currencySymbol={site.currencySymbol}
                currencyText={site.currencyText}
                depositUrl={depositUrl}
            />
        </Layout>
    );
}

export function ManualPaymentPage({ pageTitle, payment, role = 'buyer' }) {
    const Layout = role === 'buyer' ? BuyerMasterLayout : MasterLayout;
    return (
        <Layout pageTitle={pageTitle}>
            <div className="row justify-content-center my-60">
                <div className="col-xxl-8 col-lg-10">
                    <ManualPaymentConfirm payment={payment} />
                </div>
            </div>
        </Layout>
    );
}
