import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import ProfileSteps, { ProfileErrors } from '@/Components/Profile/ProfileSteps';

const emptyPortfolio = () => ({
    title: '',
    role: '',
    description: '',
    item_type: 'project',
    skill_ids: [],
    image: null,
});

export default function Portfolio({ pageTitle, user, portfolios, skills, workProfileComplete }) {
    const { routes } = usePage().props;
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm(emptyPortfolio());

    const openAddForm = () => {
        reset();
        setEditingId(null);
        setShowForm(true);
    };

    const openEditForm = (portfolio) => {
        setData({
            title: portfolio.title || '',
            role: portfolio.role || '',
            description: portfolio.description || '',
            item_type: portfolio.item_type || 'project',
            skill_ids: portfolio.skill_ids || [],
            image: null,
        });
        setEditingId(portfolio.id);
        setShowForm(true);
    };

    const toggleSkill = (skillId) => {
        setData(
            'skill_ids',
            data.skill_ids.includes(skillId)
                ? data.skill_ids.filter((id) => id !== skillId)
                : [...data.skill_ids, skillId],
        );
    };

    const submitPortfolio = (event) => {
        event.preventDefault();
        const baseUrl = routes?.userStoreProfilePortfolio ?? '/provider/store-profile-portfolio';
        const url = editingId ? `${baseUrl}/${editingId}` : baseUrl;

        post(url, {
            forceFormData: true,
            onSuccess: () => {
                setShowForm(false);
                setEditingId(null);
                reset();
            },
        });
    };

    const toggleStatus = (portfolio) => {
        const action = routes?.userStatusProfilePortfolio
            ? `${routes.userStatusProfilePortfolio}/${portfolio.id}`
            : `/provider/status-profile-portfolio/${portfolio.id}`;
        const question = portfolio.status
            ? 'Are you sure you want to disable this portfolio?'
            : 'Are you sure you want to enable this portfolio?';

        if (window.confirm(question)) {
            router.post(action);
        }
    };

    const togglePublish = () => {
        const question = workProfileComplete
            ? 'Are you sure you want to draft your profile?'
            : 'Are you sure you want to publish your profile?';

        if (window.confirm(question)) {
            router.post(routes?.userProfileComplete ?? '/provider/work-profile-complete');
        }
    };

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                <div className="profile-main-section">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="profile-bio">
                                <div className="profile-bio__item">
                                    <ProfileSteps currentRouteKey="userProfilePortfolio" userStep={user?.step ?? 0} />

                                    {workProfileComplete && (
                                        <div className="alert alert-success mb-3">
                                            Your profile is live. You can browse jobs and submit bids now.
                                        </div>
                                    )}

                                    {!workProfileComplete && (
                                        <p className="text-muted mb-3">
                                            Add at least one portfolio item — your profile will go live automatically.
                                        </p>
                                    )}

                                    <button type="button" className="btn btn--base mb-2 ms-auto d-block" onClick={openAddForm}>
                                        <i className="las la-plus-circle"></i> Add Portfolio
                                    </button>

                                    {showForm && (
                                        <div className="border rounded p-4 mb-4">
                                            <h5 className="mb-3">{editingId ? 'Update Portfolio' : 'Add Portfolio'}</h5>
                                            <ProfileErrors errors={errors} />

                                            <form onSubmit={submitPortfolio}>
                                                <div className="form-group">
                                                    <label className="form-label">Type</label>
                                                    <div className="d-flex flex-wrap gap-3">
                                                        <label className="form--check d-flex align-items-center gap-2 mb-0">
                                                            <input
                                                                type="radio"
                                                                className="form-check-input"
                                                                name="item_type"
                                                                value="project"
                                                                checked={data.item_type === 'project'}
                                                                onChange={() => setData('item_type', 'project')}
                                                            />
                                                            <span>Project</span>
                                                        </label>
                                                        <label className="form--check d-flex align-items-center gap-2 mb-0">
                                                            <input
                                                                type="radio"
                                                                className="form-check-input"
                                                                name="item_type"
                                                                value="certificate"
                                                                checked={data.item_type === 'certificate'}
                                                                onChange={() => setData('item_type', 'certificate')}
                                                            />
                                                            <span>Certificate</span>
                                                        </label>
                                                    </div>
                                                    {errors.item_type && <small className="text-danger">{errors.item_type}</small>}
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        {data.item_type === 'certificate' ? 'Certificate Title' : 'Project Title'}
                                                    </label>
                                                    <input
                                                        className="form-control form--control"
                                                        value={data.title}
                                                        onChange={(e) => setData('title', e.target.value)}
                                                        required
                                                    />
                                                    {errors.title && <small className="text-danger">{errors.title}</small>}
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        {data.item_type === 'certificate' ? 'Issuing Body / Role (Optional)' : 'Your Role (Optional)'}
                                                    </label>
                                                    <input
                                                        className="form-control form--control"
                                                        value={data.role}
                                                        onChange={(e) => setData('role', e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        {data.item_type === 'certificate' ? 'Certificate Details' : 'Project Description'}
                                                    </label>
                                                    <textarea
                                                        className="form-control form--control"
                                                        rows={4}
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        required
                                                    />
                                                    {errors.description && <small className="text-danger">{errors.description}</small>}
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Related Skills</label>
                                                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        {data.item_type === 'certificate' ? 'Certificate Image' : 'Project Image'}
                                                        {editingId ? ' (leave empty to keep current)' : ''}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        className="form-control form--control"
                                                        accept="image/jpeg,image/png,image/jpg"
                                                        onChange={(e) => setData('image', e.target.files[0])}
                                                        required={!editingId}
                                                    />
                                                    {errors.image && <small className="text-danger">{errors.image}</small>}
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    <button type="submit" className="btn btn--base" disabled={processing}>
                                                        {processing ? 'Saving...' : editingId ? 'Update' : 'Save'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline--dark"
                                                        onClick={() => {
                                                            setShowForm(false);
                                                            setEditingId(null);
                                                            reset();
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    <div className="dashboard-table">
                                        <table className="table table--responsive--md mt-4">
                                            <thead>
                                                <tr>
                                                    <th>Image</th>
                                                    <th>Type</th>
                                                    <th>Title</th>
                                                    <th>Role</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {portfolios.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center">
                                                            No portfolios yet. Add your first project above.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    portfolios.map((portfolio) => (
                                                        <tr key={portfolio.id}>
                                                            <td>
                                                                <div className="avatar avatar--sm">
                                                                    <img src={portfolio.image} alt="" />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${portfolio.item_type === 'certificate' ? 'badge--info' : 'badge--base'}`}>
                                                                    {portfolio.item_type === 'certificate' ? 'Certificate' : 'Project'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="clamping">{portfolio.title}</span>
                                                            </td>
                                                            <td>
                                                                <span className="clamping">{portfolio.role || '—'}</span>
                                                            </td>
                                                            <td>
                                                                {portfolio.status ? (
                                                                    <span className="badge badge--success">Enabled</span>
                                                                ) : (
                                                                    <span className="badge badge--warning">Disabled</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline--dark"
                                                                        onClick={() => openEditForm(portfolio)}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline--base"
                                                                        onClick={() => toggleStatus(portfolio)}
                                                                    >
                                                                        {portfolio.status ? 'Disable' : 'Enable'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="btn-wrapper d-flex flex-wrap gap-2 mt-4">
                                        <Link href={routes?.userProfileEducation ?? '/provider/profile-education'} className="btn btn-outline--dark">
                                            Previous
                                        </Link>
                                        {workProfileComplete ? (
                                            <>
                                                <Link href={routes?.freelanceJobs ?? '/jobs'} className="btn btn--base">
                                                    Browse jobs
                                                </Link>
                                                <button type="button" className="btn btn-outline--danger" onClick={togglePublish}>
                                                    Hide profile
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}
