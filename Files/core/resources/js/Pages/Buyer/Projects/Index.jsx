import { usePage } from '@inertiajs/react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import ProjectList from '@/Components/Shared/ProjectList';

export default function Index({ pageTitle, projects, filters, statusOptions }) {
    const { routes } = usePage().props;

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            <ProjectList
                projects={projects}
                filters={filters}
                statusOptions={statusOptions}
                role="buyer"
                indexUrl={routes.buyerProjects ?? '/customer/project/index'}
            />
        </BuyerMasterLayout>
    );
}
