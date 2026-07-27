import { Link, useForm, usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import ProfileSteps, { ProfileErrors } from '@/Components/Profile/ProfileSteps';

export default function Skill({ pageTitle, skills, user }) {
    const { routes } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        tagline: user?.tagline || '',
        skill_ids: user?.skill_ids || [],
        about: user?.about || '',
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
        post(routes?.userStoreProfileSkill ?? '/provider/profile-skill-store');
    };

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                <div className="profile-main-section">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="profile-bio">
                                <div className="profile-bio__item">
                                    <ProfileSteps currentRouteKey="userProfileSkill" userStep={user?.step ?? 0} />
                                    <ProfileErrors errors={errors} />

                                    <form onSubmit={submit}>
                                        <div className="form-group">
                                            <label className="form--label">Your title</label>
                                            <input
                                                type="text"
                                                className="form-control form--control"
                                                value={data.tagline}
                                                onChange={(e) => setData('tagline', e.target.value)}
                                                required
                                            />
                                            <small className="text-muted d-block mt-2">
                                                One sentence about your expertise (e.g. Licensed builder specialising in kitchen extensions).
                                            </small>
                                            {errors.tagline && <small className="text-danger d-block">{errors.tagline}</small>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form--label">Your skills</label>
                                            <p className="text-muted mb-2">Select all services you offer. Pick at least one.</p>
                                            {skills.length === 0 ? (
                                                <div className="alert alert-warning mb-0">
                                                    No skills are configured yet. Ask an admin to add skills from the admin panel.
                                                </div>
                                            ) : (
                                                <div
                                                    className="border rounded p-3"
                                                    style={{ maxHeight: '240px', overflowY: 'auto' }}
                                                >
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
                                            )}
                                            {errors.skill_ids && <small className="text-danger d-block mt-1">{errors.skill_ids}</small>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form--label">
                                                Your about <span className="text-danger">*</span>
                                            </label>
                                            <textarea
                                                className="form-control form--control"
                                                rows={8}
                                                value={data.about}
                                                onChange={(e) => setData('about', e.target.value)}
                                                required
                                            />
                                            <small className="text-muted d-block mt-2">
                                                Brief description of your experience, certifications, and typical projects.
                                            </small>
                                            {errors.about && <small className="text-danger d-block">{errors.about}</small>}
                                        </div>

                                        <div className="btn-wrapper d-flex flex-wrap gap-2">
                                            <Link href={routes?.userHome ?? '/provider/dashboard'} className="btn btn-outline--dark">
                                                Cancel
                                            </Link>
                                            <button type="submit" className="btn btn--dark" disabled={processing || skills.length === 0}>
                                                {processing ? 'Saving...' : 'Next'}
                                            </button>
                                        </div>
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
