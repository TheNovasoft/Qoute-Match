import JobPostShell from '@/Components/Layout/JobPostShell';
import JobPostFlow from '@/Components/Jobs/JobPostFlow';

export default function Index({
    pageTitle,
    categories,
    categoryForms,
    skills,
    draft,
    currencyText,
}) {
    return (
        <JobPostShell pageTitle={pageTitle} guestMode flow>
            <div className="job-post-content job-post-content--flow">
                <JobPostFlow
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
