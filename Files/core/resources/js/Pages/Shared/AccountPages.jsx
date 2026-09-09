import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import MasterLayout from '@/Components/Layout/MasterLayout';
import BuyerProfileForm from '@/Components/Shared/BuyerProfileForm';
import ChangePasswordForm from '@/Components/Shared/ChangePasswordForm';
import DepositHistory from '@/Components/Shared/DepositHistory';
import KycForm from '@/Components/Shared/KycForm';
import KycInfo from '@/Components/Shared/KycInfo';
import SupportTicketCreate from '@/Components/Shared/SupportTicketCreate';
import SupportTicketList from '@/Components/Shared/SupportTicketList';
import SupportTicketView from '@/Components/Shared/SupportTicketView';
import TransactionList from '@/Components/Shared/TransactionList';
import InvoiceList from '@/Components/Shared/InvoiceList';
import InvoiceDetail from '@/Components/Shared/InvoiceDetail';
import TwoFactorPanel from '@/Components/Shared/TwoFactorPanel';
import WithdrawHistory from '@/Components/Shared/WithdrawHistory';
import WithdrawMethods from '@/Components/Shared/WithdrawMethods';
import WithdrawPreview from '@/Components/Shared/WithdrawPreview';
import { usePage } from '@inertiajs/react';

function Layout({ role, pageTitle, backUrl, children }) {
    return role === 'buyer'
        ? <BuyerMasterLayout pageTitle={pageTitle} backUrl={backUrl}>{children}</BuyerMasterLayout>
        : <MasterLayout pageTitle={pageTitle} backUrl={backUrl}>{children}</MasterLayout>;
}

export function SupportIndex({ pageTitle, tickets, role, openUrl }) {
    return <Layout role={role} pageTitle={pageTitle}><SupportTicketList tickets={tickets} openUrl={openUrl} /></Layout>;
}

export function SupportCreate({ pageTitle, role, storeUrl, indexUrl }) {
    return <Layout role={role} pageTitle={pageTitle} backUrl={indexUrl}><SupportTicketCreate storeUrl={storeUrl} indexUrl={indexUrl} /></Layout>;
}

export function SupportView({ pageTitle, role, ticket, messages }) {
    return <Layout role={role} pageTitle={pageTitle} backUrl={ticket?.indexUrl}><SupportTicketView ticket={ticket} messages={messages} role={role} /></Layout>;
}

export function ProfileSettings({ pageTitle, profile }) {
    return <BuyerMasterLayout pageTitle={pageTitle}><BuyerProfileForm profile={profile} /></BuyerMasterLayout>;
}

export function ChangePassword({ pageTitle, role, submitUrl, backUrl }) {
    return <Layout role={role} pageTitle={pageTitle} backUrl={backUrl}><ChangePasswordForm submitUrl={submitUrl} /></Layout>;
}

export function WithdrawMethodsPage({ pageTitle, role, methods, storeUrl }) {
    const { site } = usePage().props;
    return (
        <Layout role={role} pageTitle={pageTitle}>
            <WithdrawMethods methods={methods} storeUrl={storeUrl} currencySymbol={site.currencySymbol} currencyText={site.currencyText} />
        </Layout>
    );
}

export function WithdrawPreviewPage({ pageTitle, role, preview }) {
    return <Layout role={role} pageTitle={pageTitle} backUrl={preview?.methodsUrl || preview?.indexUrl}><WithdrawPreview preview={preview} /></Layout>;
}

export function WithdrawHistoryPage({ pageTitle, role, withdrawals, indexUrl }) {
    return <Layout role={role} pageTitle={pageTitle}><WithdrawHistory withdrawals={withdrawals} indexUrl={indexUrl} /></Layout>;
}

export function TransactionsPage({ pageTitle, role, transactions, indexUrl, exportUrl }) {
    return <Layout role={role} pageTitle={pageTitle}><TransactionList transactions={transactions} indexUrl={indexUrl} exportUrl={exportUrl} /></Layout>;
}

export function InvoicesPage({ pageTitle, role, invoices, indexUrl }) {
    return <Layout role={role} pageTitle={pageTitle}><InvoiceList invoices={invoices} indexUrl={indexUrl} /></Layout>;
}

export function InvoiceDetailPage({ pageTitle, role, invoice }) {
    return <Layout role={role} pageTitle={pageTitle}><InvoiceDetail invoice={invoice} /></Layout>;
}

export function DepositsPage({ pageTitle, role, deposits }) {
    return <Layout role={role} pageTitle={pageTitle}><DepositHistory deposits={deposits} /></Layout>;
}

export function TwoFactorPage({ pageTitle, role, twoFactor }) {
    return <Layout role={role} pageTitle={pageTitle}><TwoFactorPanel twoFactor={twoFactor} /></Layout>;
}

export function KycFormPage({ pageTitle, role, fields, submitUrl, backUrl }) {
    return (
        <Layout role={role} pageTitle={pageTitle} backUrl={backUrl}>
            <div className="card custom--card"><div className="card-body"><KycForm fields={fields} submitUrl={submitUrl} /></div></div>
        </Layout>
    );
}

export function KycInfoPage({ pageTitle, role, items, backUrl }) {
    return (
        <Layout role={role} pageTitle={pageTitle} backUrl={backUrl}>
            <div className="card custom--card"><div className="card-body"><KycInfo items={items} /></div></div>
        </Layout>
    );
}
