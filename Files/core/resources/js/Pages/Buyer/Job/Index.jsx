import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';

function ActionMenu({ job, isOpen, onToggle, onClose, onDetails, routes }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const onClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('click', onClickOutside);
        return () => document.removeEventListener('click', onClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="action-btn" ref={ref}>
            <button type="button" className="action-btn__icon" onClick={onToggle} aria-label="Actions">
                <i className="fa-solid fa-caret-down"></i>
            </button>
            <ul className={`action-dropdown ${isOpen ? 'show' : ''}`}>
                <li className="action-dropdown__item">
                    <button type="button" className="action-dropdown__link" onClick={onDetails}>
                        <span className="text"><i className="las la-desktop"></i> Details</span>
                    </button>
                </li>
                {job.canEdit && (
                    <li className="action-dropdown__item">
                        <Link href={`${routes.buyerJobPostDetails}/${job.id}`} className="action-dropdown__link">
                            <span className="text"><i className="las la-pen"></i> Edit</span>
                        </Link>
                    </li>
                )}
                <li className="action-dropdown__item">
                    <Link href={`${routes.buyerJobView}/${job.id}`} className="action-dropdown__link">
                        <span className="text"><i className="las la-expand-arrows-alt"></i> Explore</span>
                    </Link>
                </li>
                {job.canViewBids && (
                    <li className="action-dropdown__item">
                        <Link href={job.compareQuotesUrl ?? `${routes.buyerJobBids}/${job.id}`} className="action-dropdown__link">
                            <span className="text"><i className="las la-columns"></i> Compare Quotes</span>
                        </Link>
                    </li>
                )}
            </ul>
        </div>
    );
}

export default function Index({ pageTitle, jobs, filters }) {
    const { routes } = usePage().props;
    const [openMenuId, setOpenMenuId] = useState(null);
    const [detailJob, setDetailJob] = useState(null);

    const { data, setData } = useForm({
        search: filters?.search ?? '',
    });

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(routes.buyerJobList ?? '/customer/job/post/index', { search: data.search }, { preserveState: true });
    };

    const jobRows = jobs?.data ?? [];

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            <div className="table-wrapper">
                <div className="table-wrapper-header d-flex justify-content-end">
                    <form className="table-search" onSubmit={submitSearch}>
                        <input
                            className="form-control form--control"
                            type="search"
                            placeholder="Search Here..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                        />
                        <button type="submit" className="table-search-text" aria-label="Search">
                            <i className="las la-search"></i>
                        </button>
                    </form>
                </div>

                <div className="dashboard-table">
                    <table className="table table--responsive--md">
                        <thead>
                            <tr>
                                <th>Job</th>
                                <th>Category | Speciality</th>
                                <th>Budget</th>
                                <th>Approved</th>
                                <th>Total Bid</th>
                                <th>Shortlisted</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center">
                                        <EmptyState message="Job not found!" />
                                    </td>
                                </tr>
                            ) : (
                                jobRows.map((job) => (
                                    <tr key={job.id}>
                                        <td data-label="Job"><span className="clamping">{job.title}</span></td>
                                        <td data-label="Category | Speciality">
                                            <div className="bid-budget-cell">
                                                <span>{job.category}</span>
                                                <span className="text--info">{job.subcategory}</span>
                                            </div>
                                        </td>
                                        <td data-label="Budget">{job.budget}</td>
                                        <td data-label="Approved">
                                            <span className={`badge ${job.approvalClass}`}>{job.approvalLabel}</span>
                                        </td>
                                        <td data-label="Total Bid">
                                            {job.canViewBids && job.bidsCount > 0 ? (
                                                <Link href={job.compareQuotesUrl ?? `${routes.buyerJobBids}/${job.id}`} className="text--base">
                                                    {job.bidsCount}
                                                </Link>
                                            ) : (
                                                job.bidsCount
                                            )}
                                        </td>
                                        <td data-label="Shortlisted">{job.shortlistedCount ?? 0}</td>
                                        <td data-label="Status">
                                            <span className={`badge ${job.statusClass}`}>{job.statusLabel}</span>
                                        </td>
                                        <td data-label="Action">
                                            <ActionMenu
                                                job={job}
                                                isOpen={openMenuId === job.id}
                                                onToggle={(event) => {
                                                    event.stopPropagation();
                                                    setOpenMenuId(openMenuId === job.id ? null : job.id);
                                                }}
                                                onClose={() => setOpenMenuId(null)}
                                                onDetails={() => {
                                                    setDetailJob(job);
                                                    setOpenMenuId(null);
                                                }}
                                                routes={routes}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {jobs?.links?.length > 0 && (
                        <div className="dashboard-table__bottom">
                            <Pagination links={jobs.links} />
                        </div>
                    )}
                </div>
            </div>

            {detailJob && (
                <div className="modal custom--modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Details</h5>
                                <button type="button" className="btn-close" onClick={() => setDetailJob(null)} aria-label="Close">
                                    <i className="las la-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item d-flex justify-content-between">
                                        <strong>Job Title</strong>
                                        <span>{detailJob.title}</span>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between">
                                        <strong>Scope</strong>
                                        <span>{detailJob.scope}</span>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between">
                                        <strong>Deadline</strong>
                                        <span>{detailJob.deadline}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn--dark btn--sm" onClick={() => setDetailJob(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </BuyerMasterLayout>
    );
}
