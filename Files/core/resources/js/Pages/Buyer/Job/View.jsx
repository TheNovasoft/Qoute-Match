import { Link, usePage } from '@inertiajs/react';
import BuyerMasterLayout from '@/Components/Layout/BuyerMasterLayout';
import RequestDataSummary from '@/Components/Jobs/RequestDataSummary';

function InfoItem({ icon, label, value }) {
    return (
        <div className="project-info__item">
            <span className="project-info__icon">
                <i className={icon}></i>
            </span>
            <div className="project-info__content">
                <p className="text">{label}</p>
                <span className="title">{value}</span>
            </div>
        </div>
    );
}

export default function View({ pageTitle, job, requestFields, backUrl }) {
    const { routes } = usePage().props;

    return (
        <BuyerMasterLayout pageTitle={pageTitle}>
            <div className="bid-job-item">
                <div className="bid-job-item__top">
                    <div className="bid-top d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div className="left">
                            <h5 className="bid-top__title mb-2">{job.title}</h5>
                            <small className="text d-block">{job.timeLabel}</small>
                        </div>
                        {!job.isApproved && (
                            <div className="right">
                                <Link
                                    href={`${routes?.buyerJobPostDetails ?? '/customer/job/post/job-details'}/${job.id}`}
                                    className="btn btn--base btn--sm"
                                >
                                    Edit
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="bid-job-item__desc mt-3" dangerouslySetInnerHTML={{ __html: job.description }} />

                    <RequestDataSummary fields={requestFields} />

                    <div className="project-info-wrapper mt-4">
                        <InfoItem icon="las la-layer-group" label="Category" value={job.category} />
                        <InfoItem icon="las la-object-ungroup" label="Speciality" value={job.subcategory} />
                        <InfoItem icon="las la-wallet" label="Budget" value={job.budget} />
                        <InfoItem icon="las la-calendar" label="Deadline" value={job.deadline} />
                        <InfoItem icon="las la-bullhorn" label="Status" value={job.statusLabel} />
                        <InfoItem icon="las la-check-circle" label="Approval" value={job.approvalLabel} />
                    </div>
                </div>

                {job.skills?.length > 0 && (
                    <div className="mt-4">
                        <h6 className="bid-job-item__title">Required skills</h6>
                        <div className="skill-expert-wrapper d-flex flex-wrap gap-2 mt-2">
                            {job.skills.map((skill) => (
                                <span key={skill} className="skill-pill">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {job.questions?.length > 0 && (
                    <div className="mt-4">
                        <h6 className="bid-job-item__title">Screening questions</h6>
                        <ul className="ps-3 mb-0 mt-2">
                            {job.questions.map((question) => (
                                <li key={question}>{question}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-4 pt-2">
                    <Link href={backUrl ?? routes?.buyerJobList ?? '/customer/job/post/index'} className="btn btn-outline--base">
                        Back to requests
                    </Link>
                </div>
            </div>
        </BuyerMasterLayout>
    );
}
