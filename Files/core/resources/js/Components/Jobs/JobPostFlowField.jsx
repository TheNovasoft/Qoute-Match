import CbmCalculator from '@/Components/Jobs/CbmCalculator';
import CountryCityFields from '@/Components/Jobs/CountryCityFields';
import WizardOptionCard from '@/Components/Jobs/WizardOptionCard';

export default function JobPostFlowField({
    step,
    data,
    errors,
    categories,
    loginUrl = '/customer/login',
    onChange,
    onSelectSingle,
    onToggleMulti,
    onSetCountryCity,
}) {
    if (step.type === 'category') {
        return (
            <div className="job-wizard-cards">
                {categories.map((cat) => (
                    <WizardOptionCard
                        key={cat.id}
                        label={cat.name}
                        selected={String(data.category_id) === String(cat.id)}
                        onClick={() => onSelectSingle('category_id', String(cat.id))}
                    />
                ))}
            </div>
        );
    }

    if (step.type === 'subcategory') {
        const cat = categories.find((c) => String(c.id) === String(data.category_id));
        const subs = cat?.subcategories || [];
        return (
            <div className="job-wizard-cards">
                {subs.map((sub) => (
                    <WizardOptionCard
                        key={sub.id}
                        label={sub.name}
                        selected={String(data.subcategory_id) === String(sub.id)}
                        onClick={() => onSelectSingle('subcategory_id', String(sub.id))}
                    />
                ))}
            </div>
        );
    }

    if (step.type === 'title-description') {
        return (
            <div className="job-flow-title-desc">
                <label className="job-flow-title-desc__label">Job title</label>
                <input
                    type="text"
                    className="form-control form--control mb-3"
                    value={data.title || ''}
                    onChange={(e) => onChange('title', e.target.value, { manual: true })}
                />
                <label className="job-flow-title-desc__label">Job description</label>
                <textarea
                    className="form-control form--control job-flow-textarea"
                    rows={10}
                    value={data.description || ''}
                    onChange={(e) => onChange('description', e.target.value, { manual: true })}
                />
            </div>
        );
    }

    if (step.type === 'title' || step.type === 'description') {
        const isDesc = step.type === 'description';
        return (
            <textarea
                className="form-control form--control job-flow-textarea"
                rows={isDesc ? 8 : 2}
                value={data[step.field] || ''}
                onChange={(e) => onChange(step.field, e.target.value, { manual: true })}
            />
        );
    }

    if (step.type === 'origin-destination') {
        return (
            <div className="row g-3 job-flow-route">
                <div className="col-6">
                    <p className="job-flow-route__label mb-2">From</p>
                    <CountryCityFields
                        countryValue={data[step.origin.countryField] || ''}
                        cityValue={data[step.origin.cityField] || ''}
                        onCountryChange={(country) => onSetCountryCity(step.origin.countryField, step.origin.cityField, country)}
                        onCityChange={(city) => onChange(step.origin.cityField, city)}
                        countryError={errors[step.origin.countryField]}
                        cityError={errors[step.origin.cityField]}
                    />
                </div>
                <div className="col-6">
                    <p className="job-flow-route__label mb-2">To</p>
                    <CountryCityFields
                        countryValue={data[step.destination.countryField] || ''}
                        cityValue={data[step.destination.cityField] || ''}
                        onCountryChange={(country) => onSetCountryCity(step.destination.countryField, step.destination.cityField, country)}
                        onCityChange={(city) => onChange(step.destination.cityField, city)}
                        countryError={errors[step.destination.countryField]}
                        cityError={errors[step.destination.cityField]}
                    />
                </div>
            </div>
        );
    }

    if (step.type === 'contact') {
        return (
            <div>
                <div className="row g-3">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control form--control"
                            placeholder="Your name"
                            value={data.firstname || ''}
                            onChange={(e) => onChange('firstname', e.target.value)}
                        />
                        {errors.firstname && <small className="text-danger">{errors.firstname}</small>}
                    </div>
                    <div className="col-md-6">
                        <input
                            type="email"
                            className="form-control form--control"
                            placeholder="Email"
                            value={data.email || ''}
                            onChange={(e) => onChange('email', e.target.value)}
                        />
                        {errors.email && <small className="text-danger">{errors.email}</small>}
                    </div>
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control form--control"
                            placeholder="Phone (optional)"
                            value={data.phone || ''}
                            onChange={(e) => onChange('phone', e.target.value)}
                        />
                    </div>
                </div>
                <p className="job-flow-login-prompt mt-3 mb-0">
                    Already a member?{' '}
                    <a href={loginUrl}>Log in to your account</a>
                </p>
            </div>
        );
    }

    if (step.type === 'cards-single') {
        return (
            <div className="job-wizard-cards">
                {step.options.map((opt) => (
                    <WizardOptionCard
                        key={opt.value}
                        label={opt.label}
                        selected={String(data[step.field]) === String(opt.value)}
                        onClick={() => onSelectSingle(step.field, opt.value)}
                    />
                ))}
            </div>
        );
    }

    if (step.type === 'cards-multi') {
        const selected = data[step.field] || [];
        return (
            <div className="job-wizard-cards">
                {step.options.map((opt) => {
                    const isSelected = selected.some((item) => String(item) === String(opt.value));
                    return (
                        <WizardOptionCard
                            key={opt.value}
                            label={opt.label}
                            selected={isSelected}
                            multi
                            onClick={() => onToggleMulti(step.field, opt.value)}
                        />
                    );
                })}
            </div>
        );
    }

    if (step.type === 'country-city') {
        return (
            <CountryCityFields
                countryValue={data[step.countryField] || ''}
                cityValue={data[step.cityField] || ''}
                onCountryChange={(country) => onSetCountryCity(step.countryField, step.cityField, country)}
                onCityChange={(city) => onChange(step.cityField, city)}
                countryError={errors[step.countryField]}
                cityError={errors[step.cityField]}
            />
        );
    }

    if (step.type === 'cargo-details') {
        return (
            <div className="row g-3">
                {step.includeContainerType && (
                    <div className="col-12">
                        <label className="job-flow-title-desc__label mb-2">Container type</label>
                        <div className="job-wizard-cards">
                            {[
                                { value: 'Full Container', label: 'Full Container (FCL)' },
                                { value: 'LCL', label: 'LCL (Less than Container Load)' },
                            ].map((opt) => (
                                <WizardOptionCard
                                    key={opt.value}
                                    label={opt.label}
                                    selected={String(data.container_type) === opt.value}
                                    onClick={() => onSelectSingle('container_type', opt.value)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div className="col-md-6">
                    <input
                        type="text"
                        className="form-control form--control"
                        placeholder="HS code"
                        value={data[step.hsField] || ''}
                        onChange={(e) => onChange(step.hsField, e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <input
                        type="number"
                        className="form-control form--control"
                        placeholder="Weight (kg)"
                        value={data[step.weightField] || ''}
                        onChange={(e) => onChange(step.weightField, e.target.value)}
                    />
                </div>
                <div className="col-12">
                    <CbmCalculator
                        value={data[step.cbmField] || ''}
                        onChange={(v) => onChange(step.cbmField, v)}
                        weightKg={data[step.weightField] || ''}
                        hideWeightInput
                    />
                </div>
            </div>
        );
    }

    if (step.type === 'cbm') {
        return (
            <CbmCalculator
                value={data[step.field] || ''}
                onChange={(v) => onChange(step.field, v)}
            />
        );
    }

    if (step.type === 'textarea') {
        return (
            <textarea
                className="form-control form--control job-flow-textarea"
                rows={4}
                value={data[step.field] || ''}
                onChange={(e) => onChange(step.field, e.target.value)}
            />
        );
    }

    if (step.type === 'file') {
        return (
            <input
                type="file"
                className="form-control form--control"
                onChange={(e) => onChange(step.field, e.target.files[0] || null)}
            />
        );
    }

    return (
        <input
            type={step.type === 'number' ? 'number' : step.type === 'date' ? 'date' : 'text'}
            className="form-control form--control"
            value={data[step.field] || ''}
            onChange={(e) => onChange(step.field, e.target.value)}
        />
    );
}
