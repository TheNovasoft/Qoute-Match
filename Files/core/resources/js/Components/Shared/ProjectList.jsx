import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Pagination from '@/Components/Shared/Pagination';
import StatusBadge from '@/Components/Shared/StatusBadge';
import VerificationBadges from '@/Components/Shared/VerificationBadges';

export default function ProjectList({ projects, filters, statusOptions = [], role = 'buyer', indexUrl }) {
    const rows = projects?.data ?? [];
    const { data, setData } = useForm({
        search: filters?.search ?? '',
        status: filters?.status ?? '',
        date: filters?.date ?? '',
    });
    const [showFilter, setShowFilter] = useState(false);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get(indexUrl, data, { preserveState: true });
    };

    return (
        <div className="card shadow-sm dashboard-list-card">
            <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
                <h5 className="card-title mb-0">My Projects</h5>

                {role === 'buyer' && (
                    <button type="button" className="btn btn-sm btn-outline--primary" onClick={() => setShowFilter((v) => !v)}>
                        <i className="las la-filter" /> Filter
                    </button>
                )}

                {role === 'freelancer' && (
                    <form className="table-search" onSubmit={submitFilter}>
                        <input
                            className="form-control form--control"
                            type="search"
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            placeholder="Search here..."
                        />
                        <button className="table-search-text" type="submit" aria-label="Search">
                            <i className="las la-search" />
                        </button>
                    </form>
                )}
            </div>

            {role === 'buyer' && showFilter && (
                <div className="card-body border-bottom">
                    <form onSubmit={submitFilter}>
                        <div className="d-flex flex-wrap gap-3">
                            <div className="flex-grow-1">
                                <input
                                    type="search"
                                    name="search"
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                    placeholder="Search by Job"
                                    className="form-control form--control"
                                />
                            </div>
                            <div className="flex-grow-1">
                                <select
                                    name="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="form-control form--control"
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-grow-1">
                                <input
                                    name="date"
                                    type="search"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="form-control form--control"
                                    placeholder="Start Date - End Date"
                                />
                            </div>
                            <div className="align-self-end">
                                <button className="btn btn--base btn-sm" type="submit">
                                    <i className="las la-filter" /> Apply
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-responsive">
                <table className="table table--light mb-0">
                    <thead>
                        <tr>
                            <th>Job</th>
                            <th>{role === 'buyer' ? 'Freelancer' : 'Buyer'}</th>
                            <th>Estimate Time</th>
                            <th>Budget</th>
                            <th>Status</th>
                            <th>Assigned at</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted py-4">No projects found.</td>
                            </tr>
                        ) : (
                            rows.map((project) => (
                                <tr key={project.id}>
                                    <td data-label="Job"><span className="clamping">{project.jobTitle}</span></td>
                                    <td data-label={role === 'buyer' ? 'Freelancer' : 'Buyer'}>
                                        <span className="d-inline-flex align-items-center flex-wrap gap-1">
                                            {project.counterparty.fullname}
                                            {project.counterparty.verificationBadges && (
                                                <VerificationBadges badges={project.counterparty.verificationBadges} compact />
                                            )}
                                        </span>
                                        {project.counterparty.profileUrl ? (
                                            <a className="d-block" href={project.counterparty.profileUrl} target="_blank" rel="noreferrer">
                                                {project.counterparty.username}
                                            </a>
                                        ) : (
                                            <span className="d-block small text-muted">{project.counterparty.username}</span>
                                        )}
                                    </td>
                                    <td data-label="Estimate Time"><span className="clamping">{project.estimatedTime}</span></td>
                                    <td data-label="Budget">
                                        <div className="bid-budget-cell">
                                            <span className="bid-budget-cell__amount">{project.bidAmount}</span>
                                            <span className={`bid-budget-cell__type ${project.customBudget ? 'text--info' : 'text--primary'}`}>
                                                {project.customBudget ? 'Customized' : 'Fixed'}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Status"><StatusBadge status={project.status} /></td>
                                    <td data-label="Assigned at">{project.assignedAt}</td>
                                    <td data-label="Action">
                                        <div className="d-flex flex-wrap gap-2">
                                            {project.canViewDetail ? (
                                                <Link href={project.detailUrl} className="btn btn-sm btn-outline--primary">
                                                    Details
                                                </Link>
                                            ) : (
                                                <span className="btn btn-sm btn-outline--primary disabled">Details</span>
                                            )}
                                            {project.uploadUrl && (
                                                <Link href={project.uploadUrl} className="btn btn-sm btn-outline--primary">
                                                    Upload
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {projects?.links?.length > 3 && (
                <div className="card-footer">
                    <Pagination links={projects.links} />
                </div>
            )}
        </div>
    );
}
