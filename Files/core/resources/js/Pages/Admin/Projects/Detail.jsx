import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminBackLink from '@/Components/Admin/AdminBackLink';

export default function Detail({ pageTitle, project }) {
    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="mb-3">
                <AdminBackLink href={project.indexUrl} label="← Back" />
            </div>

            <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Project #{project.id}</h5>
                    <span className={project.status.class}>{project.status.label}</span>
                </div>
                <div className="card-body">
                    <div className="row gy-3">
                        {project.job && (
                            <div className="col-md-6">
                                <span className="text-muted d-block">Request</span>
                                <a href={project.job.detailUrl}>{project.job.title}</a>
                            </div>
                        )}
                        {project.provider && (
                            <div className="col-md-6">
                                <span className="text-muted d-block">Provider</span>
                                <a href={project.provider.detailUrl}>{project.provider.fullname} (@{project.provider.username})</a>
                            </div>
                        )}
                        {project.buyer && (
                            <div className="col-md-6">
                                <span className="text-muted d-block">Customer</span>
                                <a href={project.buyer.detailUrl}>{project.buyer.fullname} (@{project.buyer.username})</a>
                            </div>
                        )}
                        {project.bid && (
                            <div className="col-md-6">
                                <span className="text-muted d-block">Quote</span>
                                <a href={project.bid.detailUrl}>{project.bid.amount}</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
