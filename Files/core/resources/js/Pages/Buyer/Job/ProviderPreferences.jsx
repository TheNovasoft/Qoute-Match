import { Link, useForm, usePage } from '@inertiajs/react';
import JobPostShell from '@/Components/Layout/JobPostShell';
import JobPostSteps from '@/Components/Jobs/JobPostSteps';

export default function ProviderPreferences({ pageTitle, job, skills, guestMode = false }) {
    const { routes, jobPostRoutes } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        skill_ids: job?.skill_ids || [],
        project_scope: job?.project_scope || '',
        job_longevity: job?.job_longevity || '',
        skill_level: job?.skill_level || '',
    });

    const toggleSkill = (skillId) => {
        setData(
            'skill_ids',
            data.skill_ids.includes(skillId)
                ? data.skill_ids.filter((id) => id !== skillId)
                : [...data.skill_ids, skillId],
        );
    };

    const submit = (event) => {
        event.preventDefault();
        const storeUrl = guestMode
            ? (jobPostRoutes?.preferencesStore ?? '/post-job/preferences')
            : `${routes?.buyerJobPostPreferencesStore ?? '/customer/job/post/provider-details'}/${job.id}`;
        post(storeUrl);
    };

    const previousHref = guestMode
        ? (jobPostRoutes?.details ?? routes?.postJob ?? '/post-job')
        : `${routes?.buyerJobPostDetails ?? '/customer/job/post/job-details'}/${job.id}`;

    return (
        <JobPostShell pageTitle={pageTitle} guestMode={guestMode}>
            <div className="job-post-content">
                    <div className="inner-content">
                        <JobPostSteps currentStep={2} jobId={job?.id} guestMode={guestMode} />
                    </div>

                    <form onSubmit={submit}>
                        <div className="inner-content border-top">
                            <div className="form-group">
                                <label className="form--label">Required skills</label>
                                <div className="border rounded p-3" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                    <div className="row gy-2">
                                        {skills.map((skill) => (
                                            <div className="col-md-6" key={skill.id}>
                                                <label className="form--check d-flex align-items-center gap-2 mb-0">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={data.skill_ids.includes(skill.id)}
                                                        onChange={() => toggleSkill(skill.id)}
                                                    />
                                                    <span>{skill.name}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {errors.skill_ids && <small className="text-danger d-block mt-1">{errors.skill_ids}</small>}
                            </div>

                            <div className="form-group mt-4">
                                <label className="form--label">Experience level *</label>
                                <div className="d-flex flex-wrap gap-3">
                                    {[
                                        { value: '1', label: 'Pro Level' },
                                        { value: '2', label: 'Expert' },
                                        { value: '3', label: 'Intermediate' },
                                        { value: '4', label: 'Entry' },
                                    ].map((option) => (
                                        <label key={option.value} className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                name="skill_level"
                                                checked={String(data.skill_level) === option.value}
                                                onChange={() => setData('skill_level', option.value)}
                                                required
                                            />
                                            <span className="form-check-label">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.skill_level && <small className="text-danger">{errors.skill_level}</small>}
                            </div>

                            <div className="form-group mt-4">
                                <label className="form--label">Project scope *</label>
                                <div className="d-flex flex-wrap gap-3">
                                    {[
                                        { value: '1', label: 'Large' },
                                        { value: '2', label: 'Medium' },
                                        { value: '3', label: 'Small' },
                                    ].map((option) => (
                                        <label key={option.value} className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                name="project_scope"
                                                checked={String(data.project_scope) === option.value}
                                                onChange={() => setData('project_scope', option.value)}
                                                required
                                            />
                                            <span className="form-check-label">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.project_scope && <small className="text-danger">{errors.project_scope}</small>}
                            </div>

                            <div className="form-group mt-4">
                                <label className="form--label">How long will this work take? *</label>
                                <div className="d-flex flex-wrap gap-3">
                                    {[
                                        { value: '1', label: 'Less than 1 week' },
                                        { value: '2', label: 'Less than 1 month' },
                                        { value: '3', label: '1 to 3 months' },
                                        { value: '4', label: '3 to 6 months' },
                                    ].map((option) => (
                                        <label key={option.value} className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                name="job_longevity"
                                                checked={String(data.job_longevity) === option.value}
                                                onChange={() => setData('job_longevity', option.value)}
                                                required
                                            />
                                            <span className="form-check-label">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.job_longevity && <small className="text-danger">{errors.job_longevity}</small>}
                            </div>
                        </div>

                        <div className="inner-content border-0">
                            <div className="btn-wrapper d-flex gap-2">
                                <Link
                                    href={previousHref}
                                    className="btn btn-outline--base"
                                >
                                    Previous
                                </Link>
                                <button type="submit" className="btn btn--base" disabled={processing}>
                                    {processing ? 'Saving…' : 'Next'}
                                </button>
                            </div>
                        </div>
                    </form>
            </div>
        </JobPostShell>
    );
}
