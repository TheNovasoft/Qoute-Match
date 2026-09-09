import { Link, useForm, usePage } from '@inertiajs/react';
import JobPostShell from '@/Components/Layout/JobPostShell';
import JobPostSteps from '@/Components/Jobs/JobPostSteps';
import RequestDataSummary from '@/Components/Jobs/RequestDataSummary';

export default function Budget({ pageTitle, job, requestFields, currencyText, guestMode = false, contact = {} }) {
    const { routes, jobPostRoutes } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        budget: job?.budget ?? '',
        custom_budget: job?.custom_budget ?? '0',
        deadline: job?.deadline ?? '',
        quote_validity_days: job?.quote_validity_days ?? '30',
        questions: job?.questions?.length ? job.questions : [''],
        status: guestMode ? '1' : (job?.status ?? '0'),
        firstname: contact?.firstname ?? '',
        lastname: contact?.lastname ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
    });

    const updateQuestion = (index, value) => {
        const questions = [...data.questions];
        questions[index] = value;
        setData('questions', questions);
    };

    const addQuestion = () => {
        if (data.questions.length >= 5) return;
        setData('questions', [...data.questions, '']);
    };

    const removeQuestion = (index) => {
        if (data.questions.length === 1) return;
        setData(
            'questions',
            data.questions.filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const submit = (event) => {
        event.preventDefault();
        const storeUrl = guestMode
            ? (jobPostRoutes?.budgetStore ?? '/post-job/budget')
            : `${routes?.buyerJobPostBudgetStore ?? '/customer/job/post/budget'}/${job.id}`;
        post(storeUrl);
    };

    const previousHref = guestMode
        ? (jobPostRoutes?.preferences ?? '/post-job/preferences')
        : `${routes?.buyerJobPostPreferences ?? '/customer/job/post/provider-details'}/${job.id}`;

    return (
        <JobPostShell pageTitle={pageTitle} guestMode={guestMode}>
            <div className="job-post-content">
                    <div className="inner-content">
                        <JobPostSteps currentStep={3} jobId={job?.id} guestMode={guestMode} />
                    </div>

                    <RequestDataSummary fields={requestFields} />

                    <form onSubmit={submit}>
                        <div className="inner-content border-top mt-4">
                            <div className="form-group">
                                <label className="form--label">Tell us your budget *</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control form--control"
                                        value={data.budget}
                                        onChange={(e) => setData('budget', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    <span className="input-group-text">{currencyText}</span>
                                </div>
                                {errors.budget && <small className="text-danger">{errors.budget}</small>}
                            </div>

                            <div className="form-group mt-3">
                                <label className="form--label">Allow custom proposals? *</label>
                                <div className="d-flex gap-3">
                                    <label className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            checked={data.custom_budget === '1'}
                                            onChange={() => setData('custom_budget', '1')}
                                        />
                                        <span className="form-check-label">Yes</span>
                                    </label>
                                    <label className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            checked={data.custom_budget === '0'}
                                            onChange={() => setData('custom_budget', '0')}
                                        />
                                        <span className="form-check-label">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group mt-3">
                                <label className="form--label">Request deadline *</label>
                                <input
                                    type="date"
                                    className="form-control form--control"
                                    value={data.deadline}
                                    onChange={(e) => setData('deadline', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                                {errors.deadline && <small className="text-danger">{errors.deadline}</small>}
                            </div>

                            <div className="form-group mt-3">
                                <label className="form--label">Quote validity (days)</label>
                                <input
                                    type="number"
                                    className="form-control form--control"
                                    value={data.quote_validity_days}
                                    onChange={(e) => setData('quote_validity_days', e.target.value)}
                                    min={1}
                                    max={365}
                                    placeholder="30"
                                />
                                <small className="text-muted d-block mt-1">
                                    Each provider quote stays valid for this many days after submission.
                                </small>
                                {errors.quote_validity_days && <small className="text-danger">{errors.quote_validity_days}</small>}
                            </div>

                            <div className="form-group mt-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form--label mb-0">Screening questions</label>
                                    <button type="button" className="btn btn-sm btn-outline--base" onClick={addQuestion}>
                                        Add question
                                    </button>
                                </div>
                                {data.questions.map((question, index) => (
                                    <div className="d-flex align-items-center gap-2 mb-2" key={index}>
                                        <input
                                            type="text"
                                            className="form-control form--control"
                                            value={question}
                                            onChange={(e) => updateQuestion(index, e.target.value)}
                                            placeholder="Write your question"
                                            maxLength={500}
                                            required
                                        />
                                        {data.questions.length > 1 && (
                                            <button type="button" className="btn btn-sm btn-outline--danger" onClick={() => removeQuestion(index)}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {!guestMode && (
                            <div className="form-group mt-4">
                                <label className="form--label">Publish status *</label>
                                <div className="d-flex gap-3">
                                    <label className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            checked={data.status === '1'}
                                            onChange={() => setData('status', '1')}
                                        />
                                        <span className="form-check-label">Go Live</span>
                                    </label>
                                    <label className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            checked={data.status === '0'}
                                            onChange={() => setData('status', '0')}
                                        />
                                        <span className="form-check-label">Save as Draft</span>
                                    </label>
                                </div>
                                {errors.status && <small className="text-danger">{errors.status}</small>}
                            </div>
                            )}

                            {guestMode && (
                                <div className="inner-content border-top mt-4 pt-4">
                                    <h6 className="mb-3">Your contact details</h6>
                                    <p className="text-muted small mb-3">
                                        We will create a free customer account so you can receive quotes and manage your job. Already have an account?{' '}
                                        <Link href={routes?.buyerLogin ?? '/customer/login'}>Log in here</Link>.
                                    </p>
                                    <div className="row gy-3">
                                        <div className="col-md-6">
                                            <label className="form--label">First name *</label>
                                            <input
                                                type="text"
                                                className="form-control form--control"
                                                value={data.firstname}
                                                onChange={(e) => setData('firstname', e.target.value)}
                                                required
                                            />
                                            {errors.firstname && <small className="text-danger">{errors.firstname}</small>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form--label">Last name *</label>
                                            <input
                                                type="text"
                                                className="form-control form--control"
                                                value={data.lastname}
                                                onChange={(e) => setData('lastname', e.target.value)}
                                                required
                                            />
                                            {errors.lastname && <small className="text-danger">{errors.lastname}</small>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form--label">Email *</label>
                                            <input
                                                type="email"
                                                className="form-control form--control"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                            {errors.email && <small className="text-danger d-block">{errors.email}</small>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form--label">Phone</label>
                                            <input
                                                type="text"
                                                className="form-control form--control"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                            />
                                            {errors.phone && <small className="text-danger">{errors.phone}</small>}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    {processing ? 'Posting…' : guestMode ? 'Post job free' : 'Save request'}
                                </button>
                            </div>
                        </div>
                    </form>
            </div>
        </JobPostShell>
    );
}
