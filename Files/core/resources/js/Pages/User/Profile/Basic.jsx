import { Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import ProfileSteps, { ProfileErrors } from '@/Components/Profile/ProfileSteps';

function LanguageTags({ languages, onChange, error }) {
    const [input, setInput] = useState('');

    const addLanguage = (raw) => {
        raw.split(',').forEach((part) => {
            const value = part.trim();
            if (!value || languages.includes(value) || languages.length >= 10) return;
            onChange([...languages, value]);
        });
    };

    const onKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            if (!input.trim()) return;
            addLanguage(input);
            setInput('');
        }
    };

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 mb-2">
                {languages.map((lang) => (
                    <span key={lang} className="badge bg--base d-inline-flex align-items-center gap-1">
                        {lang}
                        <button
                            type="button"
                            className="btn btn-sm p-0 border-0 text-white"
                            onClick={() => onChange(languages.filter((item) => item !== lang))}
                            aria-label={`Remove ${lang}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                className="form-control form--control"
                placeholder="Type a language and press Enter (e.g. English, Urdu)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => {
                    if (input.trim()) {
                        addLanguage(input);
                        setInput('');
                    }
                }}
            />
            <small className="text-muted d-block mt-2">Add up to 10 languages. Press Enter or comma after each one.</small>
            {error && <small className="text-danger d-block">{error}</small>}
        </div>
    );
}

export default function Basic({ pageTitle, user }) {
    const { routes } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        firstname: user?.firstname || '',
        lastname: user?.lastname || '',
        language: user?.language || [],
        address: user?.address || '',
        state: user?.state || '',
        zip: user?.zip || '',
        city: user?.city || '',
        image: null,
    });

    const submit = (event) => {
        event.preventDefault();
        post(routes?.userStoreProfileSetting ?? '/provider/profile-setting', {
            forceFormData: true,
        });
    };

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                <div className="profile-main-section">
                    <div className="row gy-4">
                        <div className="col-xl-8 col-lg-12">
                            <div className="profile-bio">
                                <div className="profile-bio__item">
                                    <ProfileSteps currentRouteKey="userProfileSetting" userStep={user?.step ?? 0} />
                                    <ProfileErrors errors={errors} />

                                    <form onSubmit={submit}>
                                        <div className="row gy-4 justify-content-center">
                                            <div className="form-group col-md-4">
                                                <label className="form-label">Profile Photo</label>
                                                {user?.image && (
                                                    <img src={user.image} alt="" className="img-fluid rounded mb-2" />
                                                )}
                                                <input
                                                    type="file"
                                                    className="form-control form--control"
                                                    accept="image/jpeg,image/png,image/jpg"
                                                    onChange={(e) => setData('image', e.target.files[0])}
                                                />
                                                {errors.image && <small className="text-danger d-block">{errors.image}</small>}
                                            </div>
                                            <div className="form-group col-md-8">
                                                <div className="row">
                                                    <div className="col-sm-6 form-group">
                                                        <label className="form-label">First Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form--control"
                                                            value={data.firstname}
                                                            onChange={(e) => setData('firstname', e.target.value)}
                                                            required
                                                        />
                                                        {errors.firstname && <small className="text-danger">{errors.firstname}</small>}
                                                    </div>
                                                    <div className="form-group col-sm-6">
                                                        <label className="form-label">Last Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form--control"
                                                            value={data.lastname}
                                                            onChange={(e) => setData('lastname', e.target.value)}
                                                            required
                                                        />
                                                        {errors.lastname && <small className="text-danger">{errors.lastname}</small>}
                                                    </div>
                                                    <div className="col-sm-12">
                                                        <div className="form-group">
                                                            <label className="form--label">Language</label>
                                                            <LanguageTags
                                                                languages={data.language}
                                                                onChange={(language) => setData('language', language)}
                                                                error={errors.language}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group col-sm-6">
                                                        <label className="form-label">E-mail Address</label>
                                                        <input className="form-control form--control" value={user?.email || ''} readOnly />
                                                    </div>
                                                    <div className="form-group col-sm-6">
                                                        <label className="form-label">Mobile Number</label>
                                                        <input className="form-control form--control" value={user?.mobile || ''} readOnly />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="form-group col-sm-6">
                                                <label className="form-label">Address</label>
                                                <input
                                                    type="text"
                                                    className="form-control form--control"
                                                    value={data.address}
                                                    onChange={(e) => setData('address', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group col-sm-6">
                                                <label className="form-label">State</label>
                                                <input
                                                    type="text"
                                                    className="form-control form--control"
                                                    value={data.state}
                                                    onChange={(e) => setData('state', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="form-group col-sm-4">
                                                <label className="form-label">Zip Code</label>
                                                <input
                                                    type="text"
                                                    className="form-control form--control"
                                                    value={data.zip}
                                                    onChange={(e) => setData('zip', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group col-sm-4">
                                                <label className="form-label">City</label>
                                                <input
                                                    type="text"
                                                    className="form-control form--control"
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group col-sm-4">
                                                <label className="form-label">Country</label>
                                                <input className="form-control form--control" value={user?.country_name || ''} readOnly />
                                            </div>
                                        </div>

                                        <div className="btn-wrapper d-flex flex-wrap gap-2">
                                            <Link href={routes?.userProfileSkill ?? '/provider/profile-skill'} className="btn btn-outline--dark">
                                                Previous
                                            </Link>
                                            <button type="submit" className="btn btn--dark" disabled={processing || data.language.length === 0}>
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
