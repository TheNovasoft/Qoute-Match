import CargoDetailsSection from '@/Components/Jobs/CargoDetailsSection';
import CbmCalculator from '@/Components/Jobs/CbmCalculator';

import CountryCityFields from '@/Components/Jobs/CountryCityFields';

import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';

import WizardOptionCard from '@/Components/Jobs/WizardOptionCard';



function FieldError({ message, tx }) {
    if (!message) {
        return null;
    }

    return <small className="text-danger d-block mt-1">{tx ? tx(message) : message}</small>;
}



function inputClass(hasError) {

    return `form-control form--control${hasError ? ' is-invalid' : ''}`;

}



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

    const { tx } = useJobPostFormTranslation();



    if (step.type === 'category') {

        return (

            <div className="job-wizard-cards">

                {categories.map((cat) => (

                    <WizardOptionCard

                        key={cat.id}

                        label={tx(cat.name)}

                        selected={String(data.category_id) === String(cat.id)}

                        onClick={() => onSelectSingle('category_id', String(cat.id))}

                    />

                ))}

                <FieldError message={errors.category_id} tx={tx} />

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

                        label={tx(sub.name)}

                        selected={String(data.subcategory_id) === String(sub.id)}

                        onClick={() => onSelectSingle('subcategory_id', String(sub.id))}

                    />

                ))}

                <FieldError message={errors.subcategory_id} tx={tx} />

            </div>

        );

    }



    if (step.type === 'title-description') {

        return (

            <div className="job-flow-title-desc">

                <label className="job-flow-title-desc__label">{tx('Job title')}</label>

                <input

                    type="text"

                    className={`${inputClass(errors.title)} mb-1`}

                    value={data.title || ''}

                    onChange={(e) => onChange('title', e.target.value, { manual: true })}

                />

                <FieldError message={errors.title} tx={tx} />

                <label className="job-flow-title-desc__label mt-3">{tx('Job description')}</label>

                <textarea

                    className={`${inputClass(errors.description)} job-flow-textarea`}

                    rows={10}

                    value={data.description || ''}

                    onChange={(e) => onChange('description', e.target.value, { manual: true })}

                />

                <FieldError message={errors.description} tx={tx} />

            </div>

        );

    }



    if (step.type === 'title' || step.type === 'description') {

        const isDesc = step.type === 'description';

        const field = isDesc ? 'description' : 'title';

        return (

            <div>

                <textarea

                    className={`${inputClass(errors[field])} job-flow-textarea`}

                    rows={isDesc ? 8 : 2}

                    value={data[field] || ''}

                    onChange={(e) => onChange(field, e.target.value, { manual: true })}

                />

                <FieldError message={errors[field]} tx={tx} />

            </div>

        );

    }



    if (step.type === 'origin-destination') {

        return (

            <div className="row g-3 job-flow-route">

                <div className="col-6">

                    <p className="job-flow-route__label mb-2">{tx('From')}</p>

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

                    <p className="job-flow-route__label mb-2">{tx('To')}</p>

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

                        <label className="form-label job-flow-title-desc__label mb-2">{tx('Email')}</label>

                        <input

                            type="email"

                            className={inputClass(errors.email)}

                            placeholder={tx('you@example.com')}

                            autoComplete="email"

                            value={data.email || ''}

                            onChange={(e) => onChange('email', e.target.value)}

                        />

                        <FieldError message={errors.email} tx={tx} />

                    </div>

                    <div className="col-md-6">

                        <label className="form-label job-flow-title-desc__label mb-2">{tx('Contact number')}</label>

                        <input

                            type="tel"

                            className={inputClass(errors.phone)}

                            placeholder={tx('Phone number')}

                            autoComplete="tel"

                            value={data.phone || ''}

                            onChange={(e) => onChange('phone', e.target.value)}

                        />

                        <FieldError message={errors.phone} tx={tx} />

                    </div>

                </div>

                <p className="job-flow-login-prompt mt-3 mb-0">

                    {tx('Already a member?')}{' '}

                    <a href={loginUrl}>{tx('Log in to your account')}</a>

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

                        label={tx(opt.label)}

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

                            label={tx(opt.label)}

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

                <CargoDetailsSection

                    step={step}

                    data={data}

                    errors={errors}

                    onChange={onChange}

                    onSelectSingle={onSelectSingle}

                    variant="flow"

                />

            </div>

        );

    }



    if (step.type === 'cbm') {

        return (

            <div>

                <CbmCalculator

                    value={data[step.field] || ''}

                    onChange={(v) => onChange(step.field, v)}

                    instruction={step.hint ? tx(step.hint) : undefined}

                />

                <FieldError message={errors[step.field]} tx={tx} />

            </div>

        );

    }



    if (step.type === 'textarea') {

        return (

            <div>

                <textarea

                    className={`${inputClass(errors[step.field])} job-flow-textarea`}

                    rows={4}

                    value={data[step.field] || ''}

                    onChange={(e) => onChange(step.field, e.target.value)}

                />

                <FieldError message={errors[step.field]} tx={tx} />

            </div>

        );

    }



    if (step.type === 'file') {

        return (

            <div>

                <input

                    type="file"

                    className={inputClass(errors[step.field])}

                    onChange={(e) => onChange(step.field, e.target.files[0] || null)}

                />

                <FieldError message={errors[step.field]} tx={tx} />

            </div>

        );

    }



    if (step.type === 'number' || step.type === 'date') {

        return (

            <div>

                <input

                    type={step.type}

                    className={inputClass(errors[step.field])}

                    value={data[step.field] || ''}

                    onChange={(e) => onChange(step.field, e.target.value)}

                />

                <FieldError message={errors[step.field]} tx={tx} />

            </div>

        );

    }



    return (

        <div>

            <input

                type={step.type === 'email' ? 'email' : 'text'}

                className={inputClass(errors[step.field])}

                value={data[step.field] || ''}

                onChange={(e) => onChange(step.field, e.target.value)}

            />

            <FieldError message={errors[step.field]} tx={tx} />

        </div>

    );

}


