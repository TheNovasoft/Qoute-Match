import { Link, router, useForm, usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import ProfileSteps, { ProfileErrors } from '@/Components/Profile/ProfileSteps';

const emptyEducation = () => ({
    id: null,
    school: '',
    year_from: '',
    year_to: '',
    degree: '',
    area_of_study: '',
    description: '',
});

export default function Education({ pageTitle, user, educations: initialEducations }) {
    const { routes } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        education: initialEducations?.length ? initialEducations : [emptyEducation()],
    });

    const updateRow = (index, field, value) => {
        const education = [...data.education];
        education[index] = { ...education[index], [field]: value };
        setData('education', education);
    };

    const addRow = () => setData('education', [...data.education, emptyEducation()]);

    const removeRow = (index) => {
        if (data.education.length === 1) return;
        setData(
            'education',
            data.education.filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const submit = (event) => {
        event.preventDefault();
        post(routes?.userStoreProfileEducation ?? '/provider/profile-education-store');
    };

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                <div className="profile-main-section">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="profile-bio">
                                <div className="profile-bio__item">
                                    <ProfileSteps currentRouteKey="userProfileEducation" userStep={user?.step ?? 0} />
                                    <ProfileErrors errors={errors} />

                                    <button type="button" className="btn btn--base mb-3 ms-auto d-block" onClick={addRow}>
                                        <i className="las la-plus-circle"></i> Add Education
                                    </button>

                                    <form onSubmit={submit}>
                                        {data.education.map((row, index) => (
                                            <div className="education-item border p-3 mt-3 position-relative" key={index}>
                                                <div className="form-group">
                                                    <label className="form-label">School</label>
                                                    <input
                                                        className="form-control form--control"
                                                        value={row.school}
                                                        onChange={(e) => updateRow(index, 'school', e.target.value)}
                                                        required
                                                        placeholder="Ex: XYZ University"
                                                    />
                                                    {errors[`education.${index}.school`] && (
                                                        <small className="text-danger">{errors[`education.${index}.school`]}</small>
                                                    )}
                                                </div>
                                                <div className="row">
                                                    <label className="form-label">Dates Attended (Optional)</label>
                                                    <div className="form-group col-sm-6">
                                                        <input
                                                            className="form-control form--control"
                                                            value={row.year_from}
                                                            onChange={(e) => updateRow(index, 'year_from', e.target.value)}
                                                            placeholder="Year From"
                                                        />
                                                    </div>
                                                    <div className="form-group col-sm-6">
                                                        <input
                                                            className="form-control form--control"
                                                            value={row.year_to}
                                                            onChange={(e) => updateRow(index, 'year_to', e.target.value)}
                                                            placeholder="Year To"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="form-group col-sm-6">
                                                        <label className="form-label">Degree (Optional)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form--control"
                                                            value={row.degree}
                                                            onChange={(e) => updateRow(index, 'degree', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="form-group col-sm-6">
                                                        <label className="form-label">Area of Study (Optional)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form--control"
                                                            value={row.area_of_study}
                                                            onChange={(e) => updateRow(index, 'area_of_study', e.target.value)}
                                                            placeholder="Ex: Construction Management"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Description (Optional)</label>
                                                    <textarea
                                                        className="form-control form--control"
                                                        value={row.description}
                                                        onChange={(e) => updateRow(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                                {data.education.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline--danger"
                                                        onClick={() => removeRow(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <div className="btn-wrapper d-flex flex-wrap gap-2 mt-4">
                                            <Link href={routes?.userProfileSetting ?? '/provider/profile-setting'} className="btn btn-outline--dark">
                                                Previous
                                            </Link>
                                            <button
                                                type="button"
                                                className="btn btn--base"
                                                onClick={() => router.post(routes?.userSkipProfileEducation ?? '/provider/profile-education-skip')}
                                            >
                                                Skip — I will add this later
                                            </button>
                                            <button type="submit" className="btn btn--dark" disabled={processing}>
                                                {processing ? 'Saving...' : 'Next'}
                                            </button>
                                        </div>
                                        <p className="text-muted small mt-3 mb-0">Education is optional. Most customers care more about your skills and past work.</p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}
