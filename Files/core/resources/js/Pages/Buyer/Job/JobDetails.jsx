import JobPostShell from '@/Components/Layout/JobPostShell';
import JobPostFlow from '@/Components/Jobs/JobPostFlow';

export default function JobDetails({
    pageTitle,
    job,
    categories,
    categoryForms,
    skills = [],
    currencyText = 'USD',
    guestMode = false,
}) {
    const draft = {
        title: job?.title || '',
        slug: job?.slug || '',
        category_id: job?.category_id || '',
        subcategory_id: job?.subcategory_id || '',
        description: job?.description || '',
        skill_ids: job?.skill_ids || [],
        project_scope: job?.project_scope || '',
        job_longevity: job?.job_longevity || '',
        skill_level: job?.skill_level || '',
        budget: job?.budget || '',
        custom_budget: job?.custom_budget,
        deadline: job?.deadline || '',
        questions: job?.questions || [''],
        request_data: job?.request_data || null,
    };

    return (
        <JobPostShell pageTitle={pageTitle} guestMode={guestMode} flow>
            <div className="job-post-content job-post-content--flow">
                <JobPostFlow
                    mode={guestMode ? 'guest' : 'buyer'}
                    jobId={job?.id || null}
                    categories={categories}
                    categoryForms={categoryForms}
                    skills={skills}
                    draft={draft}
                    currencyText={currencyText}
                />
            </div>
        </JobPostShell>
    );
}
