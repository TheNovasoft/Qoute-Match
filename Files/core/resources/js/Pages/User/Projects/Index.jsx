import { usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import ProjectList from '@/Components/Shared/ProjectList';

export default function Index({ pageTitle, projects, filters }) {
    const { routes } = usePage().props;

    return (
        <MasterLayout pageTitle={pageTitle}>
            <ProjectList
                projects={projects}
                filters={filters}
                role="freelancer"
                indexUrl={routes.userProjectIndex ?? '/provider/project/index'}
            />
        </MasterLayout>
    );
}
