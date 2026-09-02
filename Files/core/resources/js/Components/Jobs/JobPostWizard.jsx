import { Link, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CbmCalculator from '@/Components/Jobs/CbmCalculator';
import CountryCityFields from '@/Components/Jobs/CountryCityFields';
import WizardOptionCard from '@/Components/Jobs/WizardOptionCard';

function slugFromTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
}

function isFreightCategory(categoryId, categories = []) {
    const category = categories.find((item) => String(item.id) === String(categoryId));
    const name = (category?.name || '').toLowerCase();
    return name.includes('freight') || name.includes('logistic') || name.includes('shipping');
}

function hasContainerTypeField(fields = []) {
    return fields.some((field) => {
        const label = (field.label || '').toLowerCase();
        const name = (field.name || '').toLowerCase();
        return label.includes('container') || name.includes('container');
    });
}

function formatPreviewValue(value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    if (Array.isArray(value)) {
        return value.length ? value.join(', ') : '—';
    }
    if (typeof value === 'object') {
        return '—';
    }
    return String(value);
}

function buildPreviewItems(data, categories, categoryForms, { includeContact = true } = {}) {
    const items = [];
    const category = categories.find((item) => String(item.id) === String(data.category_id));
    const subcategory = category?.subcategories?.find((item) => String(item.id) === String(data.subcategory_id));

    items.push({ label: 'Category', value: `${category?.name || '—'}${subcategory ? ` › ${subcategory.name}` : ''}` });
    items.push({ label: 'Title', value: data.title });
    items.push({ label: 'Description', value: data.description });

    const dynamicFields = categoryForms?.[data.category_id] || [];
    dynamicFields.forEach((field) => {
        const value = data[field.label];
        if (field.type === 'file') {
            items.push({ label: field.name, value: value ? 'File attached' : '—' });
            return;
        }
        items.push({ label: field.name, value: formatPreviewValue(value) });
    });

    if (data.container_type && !dynamicFields.some((field) => field.label === 'container_type')) {
        items.push({ label: 'Container Type', value: data.container_type });
    }

    if (includeContact) {
        items.push({ label: 'Contact Name', value: `${data.firstname || ''} ${data.lastname || ''}`.trim() || '—' });
        items.push({ label: 'Email', value: data.email });
        if (data.phone) {
            items.push({ label: 'Phone', value: data.phone });
        }
    }

    return items;
}

function valuesFromFields(fields = []) {
    const values = {};
    fields.forEach((field) => {
        if (field.type === 'checkbox') {
            values[field.label] = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
        } else if (field.type === 'file') {
            values[field.label] = null;
        } else {
            values[field.label] = field.value ?? '';
        }
    });
    return values;
}

function buildScreens(categories, categoryForms, categoryId, { includeContact = true } = {}) {
    const screens = [
        {
            id: 'category',
            phase: 0,
            question: 'What do you need help with?',
            hint: 'Choose one option, then tap Next.',
            type: 'cards-single',
            field: 'category_id',
            options: categories.map((c) => ({ value: String(c.id), label: c.name })),
        },
        {
            id: 'subcategory',
            phase: 0,
            question: 'Which speciality fits your job?',
            hint: 'Pick the closest match, then tap Next.',
            type: 'cards-single',
            field: 'subcategory_id',
            dependsOn: 'category_id',
            options: () => {
                const cat = categories.find((c) => String(c.id) === String(categoryId));
                return (cat?.subcategories || []).map((s) => ({ value: String(s.id), label: s.name }));
            },
            skipWhen: () => {
                const cat = categories.find((c) => String(c.id) === String(categoryId));
                const subs = cat?.subcategories || [];
                return subs.length === 0;
            },
        },
        {
            id: 'title',
            phase: 0,
            question: 'Give your job a short title',
            hint: 'Example: "Bathroom renovation" or "Garden fence repair"',
            type: 'text',
            field: 'title',
            placeholder: 'e.g. Kitchen tiling job',
        },
        {
            id: 'description',
            phase: 0,
            question: 'Describe what you need done',
            hint: 'Include size, materials, timing, and anything providers should know.',
            type: 'textarea',
            field: 'description',
            placeholder: 'Tell providers about the job…',
        },
    ];

    const dynamicFields = categoryForms?.[categoryId] || [];
    const groupedCityLabels = new Set();
    const consumedLabels = new Set();

    dynamicFields.forEach((field) => {
        if (field.type === 'city' && field.locationGroup) {
            groupedCityLabels.add(field.label);
        }
    });

    dynamicFields.forEach((field) => {
        if (groupedCityLabels.has(field.label) || consumedLabels.has(field.label)) {
            return;
        }

        const showWhen = field.showWhen?.field ? field.showWhen : null;
        const baseScreen = {
            showWhen,
            required: field.isRequired,
        };

        if (field.label === 'hs_code') {
            const weightField = dynamicFields.find((item) => item.label === 'gross_weight_kg');
            const cbmField = dynamicFields.find((item) => item.type === 'cbm');

            if (weightField && cbmField) {
                screens.push({
                    ...baseScreen,
                    id: 'dynamic-cargo-details',
                    phase: 0,
                    question: 'Tell us about your cargo',
                    hint: 'HS code, weight and dimensions help providers quote accurately.',
                    type: 'cargo-details',
                    hsField: field.label,
                    weightField: weightField.label,
                    cbmField: cbmField.label,
                    hsMeta: field,
                    weightMeta: weightField,
                    cbmMeta: cbmField,
                    fields: [field.label, weightField.label, cbmField.label],
                });
                consumedLabels.add(field.label);
                consumedLabels.add(weightField.label);
                consumedLabels.add(cbmField.label);
                return;
            }
        }

        if (field.type === 'country') {
            const cityField = dynamicFields.find((item) => (
                item.type === 'city' && item.locationGroup && item.locationGroup === field.locationGroup
            ));
            const isOrigin = field.locationGroup === 'origin';

            screens.push({
                ...baseScreen,
                id: `dynamic-${field.locationGroup || field.label}`,
                phase: 0,
                question: isOrigin ? 'Where is this shipment coming from?' : 'Where should this shipment go?',
                hint: 'Select the country first, then the city.',
                type: 'country-city',
                countryField: field.label,
                cityField: cityField?.label || null,
                fields: [field.label, cityField?.label].filter(Boolean),
                required: field.isRequired || cityField?.isRequired,
            });
            return;
        }

        if (['radio', 'select'].includes(field.type) && field.options?.length) {
            screens.push({
                ...baseScreen,
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || 'Choose one option, then tap Next.',
                type: 'cards-single',
                field: field.label,
                options: field.options.map((opt) => ({ value: opt, label: opt })),
            });
        } else if (field.type === 'checkbox' && field.options?.length) {
            screens.push({
                ...baseScreen,
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || 'Select all that apply.',
                type: 'cards-multi',
                field: field.label,
                options: field.options.map((opt) => ({ value: opt, label: opt })),
            });
        } else if (field.type === 'textarea') {
            screens.push({
                ...baseScreen,
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || '',
                type: 'textarea',
                field: field.label,
            });
        } else if (field.type === 'file') {
            screens.push({
                ...baseScreen,
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || (field.extensions ? `Accepted: ${field.extensions}` : ''),
                type: 'file',
                field: field.label,
                extensions: field.extensions,
            });
        } else if (field.type === 'cbm') {
            screens.push({
                ...baseScreen,
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || 'Enter package dimensions to calculate CBM.',
                type: 'cbm',
                field: field.label,
                optional: !field.isRequired,
            });
        } else {
            screens.push({
                ...baseScreen,
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || '',
                type: field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text',
                field: field.label,
            });
        }
    });

    if (isFreightCategory(categoryId, categories) && !hasContainerTypeField(dynamicFields)) {
        screens.push({
            id: 'container-type',
            phase: 0,
            question: 'What type of shipment do you need?',
            hint: 'Full Container (FCL) for a whole container, or LCL for a shared load.',
            type: 'cards-single',
            field: 'container_type',
            options: [
                { value: 'Full Container', label: 'Full Container (FCL)' },
                { value: 'LCL', label: 'LCL (Less than Container Load)' },
            ],
        });
    }

    if (includeContact) {
        screens.push(
            {
                id: 'name',
                phase: 2,
                question: 'What is your name?',
                hint: 'So providers know who they are quoting.',
                type: 'name-split',
                fields: ['firstname', 'lastname'],
            },
            {
                id: 'email',
                phase: 2,
                question: 'What is your email?',
                hint: 'We will send quotes here and create your free account.',
                type: 'email',
                field: 'email',
                placeholder: 'you@example.com',
            },
            {
                id: 'phone',
                phase: 2,
                question: 'Phone number (optional)',
                hint: 'Providers may call if they need a quick detail.',
                type: 'text',
                field: 'phone',
                placeholder: 'Your phone number',
                optional: true,
            },
        );
    }

    screens.push({
        id: 'preview',
        phase: 2,
        question: 'Review your job post',
        hint: 'Check everything looks right, then post for free.',
        type: 'preview',
    });

    return screens.filter((screen) => !(screen.skipWhen?.() ?? false));
}

function screenIsVisible(screen, data) {
    if (screen.showWhen?.field) {
        const current = data[screen.showWhen.field];
        return screen.showWhen.values.includes(current);
    }

    return true;
}

function resolveOptions(screen, data) {
    if (typeof screen.options === 'function') {
        return screen.options();
    }
    return screen.options || [];
}

function screenIsValid(screen, data) {
    if (!screenIsVisible(screen, data)) {
        return true;
    }

    if (screen.type === 'preview') {
        return true;
    }

    if (screen.type === 'name-split') {
        return Boolean(data.firstname?.trim() && data.lastname?.trim());
    }
    if (screen.type === 'country-city') {
        return Boolean(data[screen.countryField]?.trim() && data[screen.cityField]?.trim());
    }
    if (screen.type === 'cargo-details') {
        const hsOk = !screen.hsMeta?.isRequired || Boolean(String(data[screen.hsField] ?? '').trim());
        const weightVal = data[screen.weightField];
        const weightOk = !screen.weightMeta?.isRequired || (weightVal !== '' && weightVal !== null && weightVal !== undefined);
        const cbmOk = !screen.cbmMeta?.isRequired || Boolean(String(data[screen.cbmField] ?? '').trim());
        return hsOk && weightOk && cbmOk;
    }
    if (screen.optional) {
        return true;
    }
    if (screen.required === false) {
        return true;
    }
    const field = screen.field;
    const value = data[field];

    if (screen.type === 'cards-multi') {
        const selected = Array.isArray(value) ? value : [];
        const min = screen.minSelections ?? 0;
        return selected.length >= min;
    }
    if (screen.type === 'file') {
        return screen.required ? Boolean(value) : true;
    }
    return value !== '' && value !== null && value !== undefined;
}

function isLastInPhase(screens, index) {
    const screen = screens[index];
    if (!screen) {
        return false;
    }

    return (screens[index + 1]?.phase ?? 99) > screen.phase;
}

function findScreenIndexForField(screens, field) {
    if (!field) {
        return -1;
    }

    return screens.findIndex((screen) => {
        if (screen.field === field) {
            return true;
        }

        return screen.fields?.includes(field);
    });
}

function scrollWizardToTop() {
    const target = document.querySelector('.post-job-wizard-intro')
        || document.querySelector('.job-wizard')
        || document.querySelector('.post-job-section--wizard');

    if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function JobPostWizard({
    categories,
    categoryForms,
    draft = {},
    currencyText = 'USD',
    initialPhase = 0,
    wizardPhase,
    mode = 'guest',
    jobId = null,
}) {
    const { routes, jobPostRoutes } = usePage().props;
    const isBuyer = mode === 'buyer';
    const startPhase = wizardPhase ?? initialPhase;
    const dynamicDefaults = valuesFromFields(categoryForms?.[draft.category_id] || []);

    const form = useForm({
        category_id: draft.category_id ? String(draft.category_id) : '',
        subcategory_id: draft.subcategory_id ? String(draft.subcategory_id) : '',
        title: draft.title || '',
        slug: draft.slug || '',
        description: draft.description || '',
        skill_ids: draft.skill_ids || [],
        project_scope: draft.project_scope ? String(draft.project_scope) : '',
        job_longevity: draft.job_longevity ? String(draft.job_longevity) : '',
        skill_level: draft.skill_level ? String(draft.skill_level) : '',
        budget: draft.budget || '',
        custom_budget: '1',
        deadline: draft.deadline || '',
        container_type: draft.container_type || '',
        firstname: draft.contact_firstname || '',
        lastname: draft.contact_lastname || '',
        email: draft.contact_email || '',
        phone: draft.contact_phone || '',
        status: '1',
        questions: draft.questions?.length ? draft.questions : [''],
        ...dynamicDefaults,
        ...(draft.request_data ? Object.fromEntries(
            (draft.request_data || []).map((item) => [item.label, item.value]),
        ) : {}),
    });

    const baseScreens = useMemo(
        () => buildScreens(categories, categoryForms, form.data.category_id, {
            includeContact: !isBuyer,
        }),
        [categories, categoryForms, form.data.category_id, isBuyer],
    );

    const screens = useMemo(
        () => baseScreens.filter((screen) => screenIsVisible(screen, form.data)),
        [baseScreens, form.data],
    );

    const detailsStoreUrl = isBuyer
        ? (jobId
            ? `${routes?.buyerJobPostDetailsStore ?? '/customer/job/post/job-details'}/${jobId}`
            : (routes?.buyerJobPostDetailsStore ?? '/customer/job/post/job-details'))
        : (jobPostRoutes?.detailsStore ?? '/post-job');

    const budgetStoreUrl = isBuyer
        ? `${routes?.buyerJobPostBudgetStore ?? '/customer/job/post/budget'}/${jobId}`
        : (jobPostRoutes?.budgetStore ?? '/post-job/budget');

    const findScreenIndex = useCallback((phase) => {
        const idx = screens.findIndex((s) => s.phase === phase);
        return idx >= 0 ? idx : 0;
    }, [screens]);

    const [screenIndex, setScreenIndex] = useState(() => findScreenIndex(startPhase));
    const [savingPhase, setSavingPhase] = useState(false);
    const skipScrollOnMount = useRef(true);

    useEffect(() => {
        setScreenIndex(findScreenIndex(startPhase));
        // Restart from the server phase only when that phase actually changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startPhase]);

    useEffect(() => {
        if (screenIndex > screens.length - 1) {
            setScreenIndex(Math.max(0, screens.length - 1));
        }
    }, [screens.length, screenIndex]);

    useEffect(() => {
        if (skipScrollOnMount.current) {
            skipScrollOnMount.current = false;
            if (startPhase === 0) {
                return;
            }
        }

        scrollWizardToTop();
    }, [screenIndex, startPhase]);

    useEffect(() => {
        const errorFields = Object.keys(form.errors);
        if (!errorFields.length) {
            return;
        }

        const errorIndex = findScreenIndexForField(screens, errorFields[0]);
        if (errorIndex >= 0) {
            setScreenIndex(errorIndex);
        }
    }, [form.errors, screens]);

    const screen = screens[screenIndex] || screens[0];
    const progress = screens.length <= 1
        ? 100
        : Math.round((screenIndex / (screens.length - 1)) * 100);
    const options = resolveOptions(screen, form.data);
    const canContinue = screenIsValid(screen, form.data);
    const lastInPhase = isLastInPhase(screens, screenIndex);

    useEffect(() => {
        const subIdx = screens.findIndex((s) => s.id === 'subcategory');
        if (subIdx < 0 || screenIndex !== subIdx) {
            return;
        }

        const subScreen = screens[subIdx];
        const subs = resolveOptions(subScreen, form.data);
        if (subs.length !== 1 || String(form.data.subcategory_id) === String(subs[0].value)) {
            return;
        }

        form.setData('subcategory_id', subs[0].value);
    }, [form.data.category_id, form.data.subcategory_id, screens, screenIndex]);

    const goNext = () => {
        if (screenIndex < screens.length - 1) {
            setScreenIndex(screenIndex + 1);
        }
    };

    const goBack = () => {
        if (screenIndex > 0) {
            setScreenIndex(screenIndex - 1);
        }
    };

    const saveDetailsPhase = () => {
        const slug = form.data.slug || slugFromTitle(form.data.title);
        form.transform((data) => ({ ...data, slug }));
        form.post(detailsStoreUrl, {
            forceFormData: true,
            preserveScroll: false,
            onStart: () => setSavingPhase(true),
            onFinish: () => setSavingPhase(false),
            onSuccess: () => {
                if (isBuyer) {
                    return;
                }
                const nextIdx = screens.findIndex((s) => s.phase === 2);
                setScreenIndex(nextIdx >= 0 ? nextIdx : screenIndex + 1);
            },
        });
    };

    const publishJob = () => {
        form.transform((data) => ({
            ...data,
            custom_budget: '1',
            budget: '0',
            deadline: data.deadline || '',
            status: data.status || '1',
        }));
        form.post(budgetStoreUrl, {
            preserveScroll: false,
            onStart: () => setSavingPhase(true),
            onFinish: () => setSavingPhase(false),
        });
    };

    const handleContinue = () => {
        if (!canContinue) return;

        if (screen.field === 'title' && !form.data.slug) {
            form.setData('slug', slugFromTitle(form.data.title));
        }

        const isLastInPhase0 = screen.phase === 0 && lastInPhase;

        if (isLastInPhase0) {
            saveDetailsPhase();
            return;
        }
        if (screenIndex === screens.length - 1) {
            publishJob();
            return;
        }
        goNext();
    };

    const selectSingle = (field, value) => {
        if (field === 'category_id') {
            form.setData({
                ...form.data,
                category_id: value,
                subcategory_id: '',
            });
        } else {
            form.setData(field, value);
        }
    };

    const setCountryCity = (countryField, cityField, country) => {
        form.setData({
            ...form.data,
            [countryField]: country,
            [cityField]: '',
        });
    };

    const toggleMulti = (field, value) => {
        const current = form.data[field] || [];
        const normalized = field === 'skill_ids' ? Number(value) : value;
        const exists = current.some((v) => String(v) === String(normalized));
        form.setData(
            field,
            exists
                ? current.filter((v) => String(v) !== String(normalized))
                : [...current, normalized],
        );
    };

    const renderInput = () => {
        if (screen.type === 'cards-single') {
            return (
                <div className="job-wizard-cards">
                    {options.map((opt) => (
                        <WizardOptionCard
                            key={opt.value}
                            label={opt.label}
                            description={opt.description}
                            selected={String(form.data[screen.field]) === String(opt.value)}
                            onClick={() => selectSingle(screen.field, opt.value)}
                        />
                    ))}
                </div>
            );
        }

        if (screen.type === 'cards-multi') {
            const selected = form.data[screen.field] || [];
            return (
                <div className="job-wizard-cards">
                    {options.map((opt) => {
                        const val = typeof opt.value === 'number' ? opt.value : opt.value;
                        const isSelected = selected.some((item) => String(item) === String(val));
                        return (
                            <WizardOptionCard
                                key={opt.value}
                                label={opt.label}
                                description={opt.description}
                                selected={isSelected}
                                multi
                                onClick={() => toggleMulti(screen.field, val)}
                            />
                        );
                    })}
                </div>
            );
        }

        if (screen.type === 'name-split') {
            return (
                <div className="row gy-3">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control form--control form-control-lg"
                            placeholder="First name"
                            value={form.data.firstname}
                            onChange={(e) => form.setData('firstname', e.target.value)}
                        />
                        {form.errors.firstname && <small className="text-danger">{form.errors.firstname}</small>}
                    </div>
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control form--control form-control-lg"
                            placeholder="Last name"
                            value={form.data.lastname}
                            onChange={(e) => form.setData('lastname', e.target.value)}
                        />
                        {form.errors.lastname && <small className="text-danger">{form.errors.lastname}</small>}
                    </div>
                </div>
            );
        }

        if (screen.type === 'country-city') {
            return (
                <CountryCityFields
                    countryValue={form.data[screen.countryField] || ''}
                    cityValue={form.data[screen.cityField] || ''}
                    onCountryChange={(country) => setCountryCity(screen.countryField, screen.cityField, country)}
                    onCityChange={(city) => form.setData(screen.cityField, city)}
                    countryError={form.errors[screen.countryField]}
                    cityError={form.errors[screen.cityField]}
                />
            );
        }

        if (screen.type === 'cargo-details') {
            return (
                <div className="row gy-4">
                    <div className="col-md-6">
                        <label className="form-label">{screen.hsMeta.name}</label>
                        <input
                            type="text"
                            className="form-control form--control form-control-lg"
                            placeholder="e.g. 8471.30"
                            value={form.data[screen.hsField] || ''}
                            onChange={(e) => form.setData(screen.hsField, e.target.value)}
                        />
                        {screen.hsMeta.instruction && (
                            <small className="text-muted d-block mt-1">{screen.hsMeta.instruction}</small>
                        )}
                        {form.errors[screen.hsField] && (
                            <small className="text-danger d-block mt-1">{form.errors[screen.hsField]}</small>
                        )}
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">{screen.weightMeta.name}</label>
                        <input
                            type="number"
                            className="form-control form--control form-control-lg"
                            placeholder="e.g. 500"
                            value={form.data[screen.weightField] || ''}
                            onChange={(e) => form.setData(screen.weightField, e.target.value)}
                            min="0"
                            step="any"
                        />
                        {screen.weightMeta.instruction && (
                            <small className="text-muted d-block mt-1">{screen.weightMeta.instruction}</small>
                        )}
                        {form.errors[screen.weightField] && (
                            <small className="text-danger d-block mt-1">{form.errors[screen.weightField]}</small>
                        )}
                    </div>
                    <div className="col-12">
                        <label className="form-label">{screen.cbmMeta.name}</label>
                        <CbmCalculator
                            value={form.data[screen.cbmField] || ''}
                            onChange={(nextValue) => form.setData(screen.cbmField, nextValue)}
                            weightKg={form.data[screen.weightField] || ''}
                            hideWeightInput
                        />
                        {form.errors[screen.cbmField] && (
                            <small className="text-danger d-block mt-1">{form.errors[screen.cbmField]}</small>
                        )}
                    </div>
                </div>
            );
        }

        if (screen.type === 'textarea') {
            return (
                <textarea
                    className="form-control form--control"
                    rows={6}
                    placeholder={screen.placeholder || ''}
                    value={form.data[screen.field] || ''}
                    onChange={(e) => form.setData(screen.field, e.target.value)}
                />
            );
        }

        if (screen.type === 'file') {
            return (
                <input
                    type="file"
                    className="form-control form--control form-control-lg"
                    onChange={(e) => form.setData(screen.field, e.target.files[0] || null)}
                />
            );
        }

        if (screen.type === 'cbm') {
            return (
                <CbmCalculator
                    value={form.data[screen.field] || ''}
                    onChange={(nextValue) => form.setData(screen.field, nextValue)}
                />
            );
        }

        if (screen.type === 'preview') {
            const previewItems = buildPreviewItems(form.data, categories, categoryForms, {
                includeContact: !isBuyer,
            });

            return (
                <div className="job-wizard-preview border rounded p-3 bg-light">
                    <dl className="mb-0">
                        {previewItems.map((item) => (
                            <div key={item.label}>
                                <dt className="text-muted small">{item.label}</dt>
                                <dd className="mb-2">
                                    {item.label === 'Description'
                                        ? `${String(item.value || '—').slice(0, 500)}${String(item.value || '').length > 500 ? '…' : ''}`
                                        : formatPreviewValue(item.value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            );
        }

        return (
            <input
                type={screen.type}
                className="form-control form--control form-control-lg"
                placeholder={screen.placeholder || ''}
                value={form.data[screen.field] || ''}
                onChange={(e) => form.setData(screen.field, e.target.value)}
            />
        );
    };

    const fieldError = screen.field && screen.type !== 'cargo-details' ? form.errors[screen.field] : null;

    return (
        <div className="job-wizard">
            <div className="job-wizard__progress-wrap">
                <div className="job-wizard__progress-meta">
                    <span>{progress}%</span>
                    <span>Step {screenIndex + 1} of {screens.length}</span>
                </div>
                <div className="job-wizard__progress-track" aria-hidden="true">
                    <div className="job-wizard__progress-bar" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="job-wizard__question">
                <h2 className="job-wizard__title">{screen.question}</h2>
                {screen.hint && <p className="job-wizard__hint">{screen.hint}</p>}
            </div>

            <div className="job-wizard__body">
                {renderInput()}
                {fieldError && <p className="text-danger mt-2 mb-0">{fieldError}</p>}
                {screen.id === 'email' && form.errors.email && (
                    <p className="text-danger mt-2 mb-0">
                        {form.errors.email}{' '}
                        <Link href={routes?.buyerLogin ?? '/customer/login'}>Log in</Link>
                    </p>
                )}
            </div>

            <div className="job-wizard__actions">
                {screenIndex > 0 ? (
                    <button type="button" className="btn btn-outline--dark" onClick={goBack} disabled={form.processing || savingPhase}>
                        Back
                    </button>
                ) : (
                    <span />
                )}

                <button
                    type="button"
                    className="btn btn--base"
                    onClick={handleContinue}
                    disabled={!canContinue || form.processing || savingPhase}
                >
                    {form.processing || savingPhase
                        ? 'Saving…'
                        : screen.type === 'preview' || screenIndex === screens.length - 1
                            ? 'Post job free'
                            : lastInPhase
                                ? 'Save & continue'
                                : 'Next'}
                </button>
            </div>
        </div>
    );
}
