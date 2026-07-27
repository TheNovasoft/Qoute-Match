import { Link, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WizardOptionCard from '@/Components/Jobs/WizardOptionCard';

const SKILL_LEVELS = [
    { value: '1', label: 'Pro level', description: 'Highly experienced specialists' },
    { value: '2', label: 'Expert', description: 'Strong track record in this field' },
    { value: '3', label: 'Intermediate', description: 'Solid experience for most jobs' },
    { value: '4', label: 'Entry level', description: 'Good for simpler tasks' },
];

const PROJECT_SCOPES = [
    { value: '3', label: 'Small project', description: 'Quick job or minor work' },
    { value: '2', label: 'Medium project', description: 'A clear piece of work with a few tasks' },
    { value: '1', label: 'Large project', description: 'Bigger job with multiple stages' },
];

const JOB_DURATIONS = [
    { value: '1', label: 'Less than 1 week' },
    { value: '2', label: 'Less than 1 month' },
    { value: '3', label: '1 to 3 months' },
    { value: '4', label: '3 to 6 months' },
];

const CUSTOM_BUDGET_OPTIONS = [
    { value: '1', label: 'Yes', description: 'Providers can suggest a different price' },
    { value: '0', label: 'No', description: 'Stick to my stated budget' },
];

function slugFromTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
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

function buildScreens(categories, categoryForms, skills, categoryId, { includeContact = true } = {}) {
    const categorySkills = (skills || []).filter((skill) => {
        if (!categoryId) {
            return true;
        }
        if (skill.category_id === null || skill.category_id === undefined || skill.category_id === '') {
            return true;
        }
        return String(skill.category_id) === String(categoryId);
    });

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
    dynamicFields.forEach((field) => {
        if (['radio', 'select'].includes(field.type) && field.options?.length) {
            screens.push({
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
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || '',
                type: 'textarea',
                field: field.label,
                required: field.isRequired,
            });
        } else if (field.type === 'file') {
            screens.push({
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || (field.extensions ? `Accepted: ${field.extensions}` : ''),
                type: 'file',
                field: field.label,
                extensions: field.extensions,
                required: field.isRequired,
            });
        } else {
            screens.push({
                id: `dynamic-${field.label}`,
                phase: 0,
                question: field.name,
                hint: field.instruction || '',
                type: field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text',
                field: field.label,
                required: field.isRequired,
            });
        }
    });

    screens.push(
        {
            id: 'skills',
            phase: 1,
            question: 'Which skills should providers have?',
            hint: categorySkills.length
                ? 'Select all that apply for this category, then tap Next.'
                : 'No skills are set for this category yet. Tap Next to continue.',
            type: 'cards-multi',
            field: 'skill_ids',
            options: categorySkills.map((s) => ({ value: s.id, label: s.name })),
            minSelections: categorySkills.length ? 1 : 0,
            optional: categorySkills.length === 0,
        },
        {
            id: 'skill_level',
            phase: 1,
            question: 'What experience level do you need?',
            hint: 'Choose the level that fits your job, then tap Next.',
            type: 'cards-single',
            field: 'skill_level',
            options: SKILL_LEVELS,
        },
        {
            id: 'project_scope',
            phase: 1,
            question: 'How big is this project?',
            hint: 'This helps providers understand the scope. Tap Next when ready.',
            type: 'cards-single',
            field: 'project_scope',
            options: PROJECT_SCOPES,
        },
        {
            id: 'job_longevity',
            phase: 1,
            question: 'How long will the work take?',
            hint: 'Your best estimate is fine. Tap Next when ready.',
            type: 'cards-single',
            field: 'job_longevity',
            options: JOB_DURATIONS,
        },
        {
            id: 'budget',
            phase: 2,
            question: 'What is your budget?',
            hint: 'Enter the amount you are willing to pay.',
            type: 'number',
            field: 'budget',
            placeholder: '0.00',
        },
        {
            id: 'custom_budget',
            phase: 2,
            question: 'Can providers suggest a different price?',
            hint: 'Choose one option, then tap Next.',
            type: 'cards-single',
            field: 'custom_budget',
            options: CUSTOM_BUDGET_OPTIONS,
        },
        {
            id: 'deadline',
            phase: 2,
            question: 'When do you need this done by?',
            hint: 'Pick the latest date you need the work completed.',
            type: 'date',
            field: 'deadline',
        },
    );

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

    return screens.filter((screen) => !(screen.skipWhen?.() ?? false));
}

function resolveOptions(screen, data) {
    if (typeof screen.options === 'function') {
        return screen.options();
    }
    return screen.options || [];
}

function screenIsValid(screen, data) {
    if (screen.type === 'name-split') {
        return Boolean(data.firstname?.trim() && data.lastname?.trim());
    }
    if (screen.optional) {
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
    skills,
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
        custom_budget: draft.custom_budget !== undefined && draft.custom_budget !== null && draft.custom_budget !== ''
            ? String(draft.custom_budget)
            : '0',
        deadline: draft.deadline || '',
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

    const screens = useMemo(
        () => buildScreens(categories, categoryForms, skills, form.data.category_id, {
            includeContact: !isBuyer,
        }),
        [categories, categoryForms, skills, form.data.category_id, isBuyer],
    );

    const detailsStoreUrl = isBuyer
        ? (jobId
            ? `${routes?.buyerJobPostDetailsStore ?? '/customer/job/post/job-details'}/${jobId}`
            : (routes?.buyerJobPostDetailsStore ?? '/customer/job/post/job-details'))
        : (jobPostRoutes?.detailsStore ?? '/post-job');

    const preferencesStoreUrl = isBuyer
        ? `${routes?.buyerJobPostPreferencesStore ?? '/customer/job/post/provider-details'}/${jobId}`
        : (jobPostRoutes?.preferencesStore ?? '/post-job/preferences');

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
    }, [startPhase, findScreenIndex]);

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
                const nextIdx = screens.findIndex((s) => s.phase === 1);
                setScreenIndex(nextIdx >= 0 ? nextIdx : screenIndex + 1);
            },
        });
    };

    const savePreferencesPhase = () => {
        form.post(preferencesStoreUrl, {
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
        const isLastInPhase1 = screen.phase === 1 && lastInPhase;

        if (isLastInPhase0) {
            saveDetailsPhase();
            return;
        }
        if (isLastInPhase1) {
            savePreferencesPhase();
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
            const allowed = (skills || [])
                .filter((skill) => {
                    if (skill.category_id === null || skill.category_id === undefined || skill.category_id === '') {
                        return true;
                    }
                    return String(skill.category_id) === String(value);
                })
                .map((skill) => skill.id);

            form.setData({
                ...form.data,
                category_id: value,
                subcategory_id: '',
                skill_ids: (form.data.skill_ids || []).filter((id) => allowed.some((allowedId) => String(allowedId) === String(id))),
            });
        } else {
            form.setData(field, value);
        }
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

        if (screen.type === 'number' && screen.field === 'budget') {
            return (
                <div className="input-group input-group-lg">
                    <input
                        type="number"
                        className="form-control form--control"
                        placeholder={screen.placeholder}
                        value={form.data.budget}
                        onChange={(e) => form.setData('budget', e.target.value)}
                        min="0"
                        step="0.01"
                    />
                    <span className="input-group-text">{currencyText}</span>
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
                min={screen.type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
            />
        );
    };

    const fieldError = screen.field ? form.errors[screen.field] : null;

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
                        : screenIndex === screens.length - 1
                            ? 'Post job free'
                            : lastInPhase
                                ? 'Save & continue'
                                : 'Next'}
                </button>
            </div>
        </div>
    );
}
