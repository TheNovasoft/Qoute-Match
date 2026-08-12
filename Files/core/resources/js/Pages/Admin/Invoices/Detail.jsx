import AdminLayout from '@/Components/Layout/AdminLayout';
import InvoiceDetail from '@/Components/Shared/InvoiceDetail';

export default function Detail({ pageTitle, invoice }) {
    return (
        <AdminLayout pageTitle={pageTitle}>
            <InvoiceDetail invoice={invoice} />
        </AdminLayout>
    );
}
