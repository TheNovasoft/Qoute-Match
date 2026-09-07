import { Link, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JobPostFlowField from '@/Components/Jobs/JobPostFlowField';
import JobPostFormTranslateButton from '@/Components/Jobs/JobPostFormTranslateButton';
import { JobPostFormTranslationProvider, useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';
import { collectJobPostFormStrings } from '@/utils/jobPostFormStrings';
import { stepFieldKeys, validateStep } from '@/utils/jobPostFlowValidation';
import {
    buildFlowSteps,
    generateDescription,
    generateTitle,
    skillsForCategory,
    stepIsVisible,
    suggestSkillIds,
    summarizeStep,
    valuesFromFields,
} from '@/utils/jobPostFlowUtils';

function slugFromTitle(title) {
    return title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function hasFileUploads(data) {
    return Object.values(data).some((value) => {
        if (value instanceof File) {
            return true;
        }
        if (Array.isArray(value)) {
            return value.some((item) => item instanceof File);
        }
        return false;
    });
}

function scrollToStep(element) {
    if (!element) {
        return;
    }
    const rect = element.getBoundingClientRect();
    const inView = rect.top >= 72 && rect.bottom <= window.innerHeight - 40;
    if (inView) {
        return;
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const AUTO_ADVANCE_TYPES = new Set(['category', 'subcategory', 'cards-single']);

export default function JobPostFlow(props) {
    const { formTranslateLocale } = usePage().props;

    return (
        <JobPostFormTranslationProvider locale={formTranslateLocale}>
            <JobPostFlowInner {...props} />
        </JobPostFormTranslationProvider>
    );
}

function JobPostFlowInner({
    categories,
    categoryForms,
    skills = [],
    draft = {},
    currencyText = 'USD',
    mode = 'guest',
    jobId = null,
}) {
    const { routes, jobPostRoutes } = usePage().props;
    const { tx } = useJobPostFormTranslation();
    const isBuyer = mode === 'buyer';
    const dynamicDefaults = valuesFromFields(categoryForms?.[draft.category_id] || []);

    const allDynamicDefaults = useMemo(() => {
        const patch = {};
        Object.values(categoryForms || {}).forEach((fields) => {
            (fields || []).forEach((field) => {
                if (patch[field.label] === undefined) {
                    if (field.type === 'checkbox') {
                        patch[field.label] = [];
                    } else if (field.type === 'file') {
                        patch[field.label] = null;
                    } else {
                        patch[field.label] = '';
                    }
                }
            });
        });
        return patch;
    }, [categoryForms]);

    const coreRef = useRef({
        category_id: draft.category_id ? String(draft.category_id) : '',
        subcategory_id: draft.subcategory_id ? String(draft.subcategory_id) : '',
    });

    const form = useForm({
        category_id: draft.category_id ? String(draft.category_id) : '',
        subcategory_id: draft.subcategory_id ? String(draft.subcategory_id) : '',
        title: draft.title || '',
        slug: draft.slug || '',
        description: draft.description || '',
        skill_ids: draft.skill_ids || [],
        project_scope: draft.project_scope ? String(draft.project_scope) : '2',
        job_longevity: draft.job_longevity ? String(draft.job_longevity) : '2',
        skill_level: draft.skill_level ? String(draft.skill_level) : '3',
        budget: draft.budget || '',
        custom_budget: draft.custom_budget != null ? String(draft.custom_budget) : '1',
        deadline: draft.deadline || '',
        container_type: draft.container_type || '',
        firstname: draft.contact_firstname || '',
        lastname: draft.contact_lastname || '',
        email: draft.contact_email || '',
        phone: draft.contact_phone || '',
        status: '1',
        questions: draft.questions?.length ? draft.questions : [''],
        ...allDynamicDefaults,
        ...dynamicDefaults,
        ...(draft.request_data ? Object.fromEntries(
            (draft.request_data || []).map((item) => [item.label, item.value]),
        ) : {}),
    });

    const [completedIds, setCompletedIds] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [clientErrors, setClientErrors] = useState({});
    const [titleManual, setTitleManual] = useState(Boolean(draft.title));
    const [descManual, setDescManual] = useState(Boolean(draft.description));
    const stepRefs = useRef({});

    const allSteps = useMemo(
        () => buildFlowSteps(categories, categoryForms, form.data.category_id, { includeContact: !isBuyer }),
        [categories, categoryForms, form.data.category_id, isBuyer],
    );

    const visibleSteps = useMemo(
        () => allSteps.filter((step) => stepIsVisible(step, form.data)),
        [allSteps, form.data],
    );

    const activeStepId = useMemo(() => {
        if (editingId && visibleSteps.some((s) => s.id === editingId)) {
            return editingId;
        }
        const next = visibleSteps.find((step) => !completedIds.includes(step.id));
        return next?.id || visibleSteps[visibleSteps.length - 1]?.id;
    }, [visibleSteps, completedIds, editingId]);

    const activeStep = visibleSteps.find((s) => s.id === activeStepId);

    useEffect(() => {
        if (activeStepId === 'review') {
            const patch = {};
            if (coreRef.current.category_id && !form.data.category_id) {
                patch.category_id = coreRef.current.category_id;
            }
            if (coreRef.current.subcategory_id && !form.data.subcategory_id) {
                patch.subcategory_id = coreRef.current.subcategory_id;
            }
            if (Object.keys(patch).length) {
                form.setData((current) => ({ ...current, ...patch }));
            }
        }
    }, [activeStepId, form.data.category_id, form.data.subcategory_id]);

    const fieldErrors = useMemo(
        () => ({ ...clientErrors, ...form.errors }),
        [clientErrors, form.errors],
    );

    const clearClientError = useCallback((field) => {
        if (!field) {
            return;
        }
        setClientErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const clearStepClientErrors = useCallback((step) => {
        const keys = stepFieldKeys(step);
        if (!keys.length) {
            return;
        }
        setClientErrors((prev) => {
            const next = { ...prev };
            let changed = false;
            keys.forEach((key) => {
                if (next[key]) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, []);
    const flowData = useMemo(() => ({
        ...form.data,
        category_id: form.data.category_id || coreRef.current.category_id,
        subcategory_id: form.data.subcategory_id || coreRef.current.subcategory_id,
        skill_ids: Array.isArray(form.data.skill_ids) ? form.data.skill_ids : [],
    }), [form.data]);

    const formStrings = useMemo(() => collectJobPostFormStrings({
        categories,
        categoryForms,
        steps: allSteps,
        isBuyer,
    }), [categories, categoryForms, allSteps, isBuyer]);

    const completeStoreUrl = isBuyer
        ? (jobId
            ? `${routes?.buyerJobPostCompleteStore ?? '/customer/job/post/complete'}/${jobId}`
            : (routes?.buyerJobPostCompleteStore ?? '/customer/job/post/complete'))
        : (jobPostRoutes?.completeStore ?? '/post-job/complete');

    const applyGeneratedContent = useCallback((stepId) => {
        if (stepId === 'title-description') {
            const currentData = {
                ...form.data,
                category_id: form.data.category_id || coreRef.current.category_id,
                subcategory_id: form.data.subcategory_id || coreRef.current.subcategory_id,
            };
            const patch = {};
            if (!titleManual) {
                patch.title = generateTitle(currentData, categories, categoryForms);
            }
            if (!descManual) {
                patch.description = generateDescription(currentData, categories, categoryForms);
            }
            if (Object.keys(patch).length) {
                form.setData((current) => ({ ...current, ...patch }));
            }
        }
    }, [form, categories, categoryForms, titleManual, descManual]);

    useEffect(() => {
        if (activeStepId) {
            applyGeneratedContent(activeStepId);
            const timer = window.setTimeout(() => scrollToStep(stepRefs.current[activeStepId]), 120);
            return () => window.clearTimeout(timer);
        }
        return undefined;
    }, [activeStepId, applyGeneratedContent]);

    useEffect(() => {
        if (form.data.category_id) {
            coreRef.current.category_id = String(form.data.category_id);
        }
        if (form.data.subcategory_id) {
            coreRef.current.subcategory_id = String(form.data.subcategory_id);
        }
    }, [form.data.category_id, form.data.subcategory_id]);

    useEffect(() => {
        const cat = categories.find((c) => String(c.id) === String(form.data.category_id));
        const subs = cat?.subcategories || [];
        if (subs.length === 1 && !form.data.subcategory_id) {
            const subId = String(subs[0].id);
            coreRef.current.subcategory_id = subId;
            form.setData('subcategory_id', subId);
        }
    }, [form.data.category_id]);

    const clearDynamicFields = (categoryId) => {
        const patch = {};
        Object.keys(categoryForms || {}).forEach((id) => {
            (categoryForms[id] || []).forEach((field) => {
                patch[field.label] = field.type === 'checkbox' ? [] : '';
            });
        });
        const newDefaults = valuesFromFields(categoryForms?.[categoryId] || []);
        return { ...patch, ...newDefaults, container_type: '' };
    };

    const resetFromStep = (stepId) => {
        const index = visibleSteps.findIndex((s) => s.id === stepId);
        if (index < 0) {
            return;
        }
        const toRemove = visibleSteps.slice(index + 1).map((s) => s.id);
        setCompletedIds((prev) => prev.filter((id) => {
            const idx = visibleSteps.findIndex((s) => s.id === id);
            return idx >= 0 && idx <= index && !toRemove.includes(id);
        }));

        if (stepId === 'category' || stepId === 'subcategory') {
            setTitleManual(false);
            setDescManual(false);
        }
        if (stepId !== 'title-description' && stepId !== 'contact' && stepId !== 'review') {
            setTitleManual(false);
            setDescManual(false);
        }
    };

    const completeStep = (step, dataOverride = null) => {
        const payload = dataOverride || flowData;
        const validation = validateStep(step, payload);

        if (!validation.valid) {
            setClientErrors((prev) => ({ ...prev, ...validation.errors }));
            return;
        }

        clearStepClientErrors(step);

        if (step.id === 'title-description') {
            const patch = {};
            if (!payload.title) {
                patch.title = generateTitle(payload, categories, categoryForms);
            }
            if (!payload.description) {
                patch.description = generateDescription(payload, categories, categoryForms);
            }
            if (Object.keys(patch).length) {
                form.setData((current) => ({ ...current, ...patch }));
            }
        }

        setCompletedIds((prev) => [...new Set([...prev, step.id])]);
        setEditingId(null);

        const currentIndex = visibleSteps.findIndex((s) => s.id === step.id);
        const nextStep = visibleSteps[currentIndex + 1];
        if (nextStep) {
            applyGeneratedContent(nextStep.id);
            window.setTimeout(() => scrollToStep(stepRefs.current[nextStep.id]), 150);
        }
    };

    const maybeAutoAdvance = (step, dataOverride) => {
        if (!step || !AUTO_ADVANCE_TYPES.has(step.type)) {
            return;
        }
        window.setTimeout(() => completeStep(step, dataOverride), 80);
    };

    const handleFieldChange = (field, value, { manual = false } = {}) => {
        clearClientError(field);
        if (field === 'title' && manual) {
            setTitleManual(true);
        }
        if (field === 'description' && manual) {
            setDescManual(true);
        }
        form.setData(field, value);
    };

    const handleCategorySelect = (field, value) => {
        const activeStep = visibleSteps.find((s) => s.id === activeStepId);

        if (field === 'category_id') {
            clearClientError('category_id');
            const cat = categories.find((c) => String(c.id) === String(value));
            const subs = cat?.subcategories || [];
            const dynamicPatch = clearDynamicFields(value);
            const categoryId = String(value);
            const subcategoryId = subs.length === 1 ? String(subs[0].id) : '';
            coreRef.current.category_id = categoryId;
            coreRef.current.subcategory_id = subcategoryId;

            form.setData((current) => ({
                ...current,
                ...dynamicPatch,
                category_id: categoryId,
                subcategory_id: subcategoryId,
            }));

            resetFromStep('category');

            const nextData = {
                ...form.data,
                ...dynamicPatch,
                category_id: categoryId,
                subcategory_id: subcategoryId,
            };
            maybeAutoAdvance(activeStep, nextData);
            if (subs.length === 1) {
                const subStep = visibleSteps.find((s) => s.id === 'subcategory');
                if (subStep) {
                    maybeAutoAdvance(subStep, nextData);
                }
            }
            return;
        }

        if (field === 'subcategory_id') {
            clearClientError('subcategory_id');
            const subId = String(value);
            coreRef.current.subcategory_id = subId;
            const nextData = { ...form.data, subcategory_id: subId };
            form.setData((current) => ({ ...current, subcategory_id: subId }));
            maybeAutoAdvance(activeStep, nextData);
            return;
        }

        form.setData((current) => ({ ...current, [field]: value }));
        clearClientError(field);
        maybeAutoAdvance(activeStep, { ...form.data, [field]: value });
    };

    const completeStepHandler = (step) => completeStep(step);

    const startEdit = (stepId) => {
        setEditingId(stepId);
        setCompletedIds((prev) => prev.filter((id) => {
            const idx = visibleSteps.findIndex((s) => s.id === id);
            const editIdx = visibleSteps.findIndex((s) => s.id === stepId);
            return idx <= editIdx;
        }));
        window.setTimeout(() => scrollToStep(stepRefs.current[stepId]), 100);
    };

    const buildSubmitPayload = () => {
        const categoryId = coreRef.current.category_id || form.data.category_id;
        const subcategoryId = coreRef.current.subcategory_id || form.data.subcategory_id;
        const mergedData = { ...form.data, ...flowData, category_id: categoryId, subcategory_id: subcategoryId };
        const categoryFields = categoryForms?.[categoryId] || categoryForms?.[String(categoryId)] || [];
        const dynamicValues = {};
        categoryFields.forEach((field) => {
            dynamicValues[field.label] = mergedData[field.label] ?? (field.type === 'checkbox' ? [] : '');
        });

        const title = mergedData.title?.trim() || generateTitle({ ...mergedData, ...dynamicValues }, categories, categoryForms);
        let skillIds = (mergedData.skill_ids || []).map((id) => Number(id)).filter(Boolean);
        if (!skillIds.length) {
            skillIds = suggestSkillIds({ ...mergedData, ...dynamicValues }, skills, categories, categoryForms);
        }
        if (!skillIds.length && categoryId) {
            skillIds = skillsForCategory(skills, categoryId).slice(0, 6).map((skill) => Number(skill.id));
        }

        return {
            ...mergedData,
            ...dynamicValues,
            title,
            slug: mergedData.slug || slugFromTitle(title),
            category_id: Number(categoryId),
            subcategory_id: Number(subcategoryId),
            skill_ids: skillIds,
            lastname: mergedData.lastname || mergedData.firstname || 'Customer',
            budget: mergedData.custom_budget === '1' ? 0 : (mergedData.budget || 0),
            project_scope: mergedData.project_scope || '2',
            job_longevity: mergedData.job_longevity || '2',
            skill_level: mergedData.skill_level || '3',
            custom_budget: mergedData.custom_budget || '1',
            status: '1',
        };
    };

    const submitJob = () => {
        const payload = buildSubmitPayload();

        if (!payload.category_id || Number.isNaN(payload.category_id)) {
            startEdit('category');
            return;
        }

        const cat = categories.find((c) => String(c.id) === String(payload.category_id));
        if ((cat?.subcategories || []).length > 0 && (!payload.subcategory_id || Number.isNaN(payload.subcategory_id))) {
            startEdit('subcategory');
            return;
        }

        form.transform(() => payload);
        form.post(completeStoreUrl, {
            forceFormData: hasFileUploads(payload),
            preserveScroll: true,
            onError: () => {
                coreRef.current.category_id = String(payload.category_id);
                coreRef.current.subcategory_id = String(payload.subcategory_id);
            },
        });
    };

    const renderReview = () => (
        <div className="job-flow-review">
            {visibleSteps.filter((s) => s.type !== 'review').map((step) => (
                <div key={step.id} className="job-flow-review__row">
                    <div className="job-flow-review__head">
                        <strong>{tx(step.question)}</strong>
                        <button type="button" className="job-flow-edit-btn" onClick={() => startEdit(step.id)}>
                            {tx('Edit')}
                        </button>
                    </div>
                    <p className="job-flow-review__value">{summarizeStep(step, flowData, categories)}</p>
                </div>
            ))}
            <button
                type="button"
                className="btn btn--base job-flow-submit"
                onClick={submitJob}
                disabled={form.processing}
            >
                {form.processing ? tx('Posting…') : tx(isBuyer ? 'Post job' : 'Post job free')}
            </button>
        </div>
    );

    return (
        <div className="job-flow">
            <div className="post-job-flow-intro text-center mb-3 position-relative">
                <JobPostFormTranslateButton strings={formStrings} />
                <h1 className="post-job-flow-intro__title mb-2">{tx('Tell us what you need done')}</h1>
                <p className="post-job-flow-intro__text mb-0 text-muted">
                    {tx('Answer a few questions — your previous answers stay visible below and can be edited anytime.')}
                </p>
            </div>

            <div className="job-flow__steps">
                {visibleSteps.map((step) => {
                    const isCompleted = completedIds.includes(step.id) && editingId !== step.id;
                    const isActive = step.id === activeStepId;
                    const isFuture = !isCompleted && !isActive;

                    if (isFuture) {
                        return null;
                    }

                    if (step.type === 'review' && isActive) {
                        return (
                            <section
                                key={step.id}
                                ref={(el) => { stepRefs.current[step.id] = el; }}
                                className="job-flow-step job-flow-step--active"
                            >
                                <h2 className="job-flow-step__question">{tx(step.question)}</h2>
                                {step.hint && <p className="job-flow-step__hint">{tx(step.hint)}</p>}
                                {renderReview()}
                            </section>
                        );
                    }

                    if (isCompleted) {
                        return (
                            <section key={step.id} className="job-flow-step job-flow-step--done">
                                <div className="job-flow-step__done-head">
                                    <span className="job-flow-step__done-label">{tx(step.question)}</span>
                                    <button type="button" className="job-flow-edit-btn" onClick={() => startEdit(step.id)}>
                                        {tx('Edit')}
                                    </button>
                                </div>
                                <p className="job-flow-step__done-value">{summarizeStep(step, flowData, categories)}</p>
                            </section>
                        );
                    }

                    return (
                        <section
                            key={step.id}
                            ref={(el) => { stepRefs.current[step.id] = el; }}
                            className="job-flow-step job-flow-step--active"
                        >
                            <h2 className="job-flow-step__question">{tx(step.question)}</h2>
                            {step.hint && <p className="job-flow-step__hint">{tx(step.hint)}</p>}
                            <div className="job-flow-step__body">
                                <JobPostFlowField
                                    step={step}
                                    data={flowData}
                                    errors={fieldErrors}
                                    categories={categories}
                                    loginUrl={routes?.buyerLogin ?? '/customer/login'}
                                    onChange={handleFieldChange}
                                    onSelectSingle={handleCategorySelect}
                                    onToggleMulti={(field, value) => {
                                        clearClientError(field);
                                        form.setData((current) => {
                                            const selected = current[field] || [];
                                            const exists = selected.some((v) => String(v) === String(value));
                                            return {
                                                ...current,
                                                [field]: exists
                                                    ? selected.filter((v) => String(v) !== String(value))
                                                    : [...selected, value],
                                            };
                                        });
                                    }}
                                    onSetCountryCity={(countryField, cityField, country) => {
                                        clearClientError(countryField);
                                        clearClientError(cityField);
                                        form.setData((current) => ({
                                            ...current,
                                            [countryField]: country,
                                            [cityField]: '',
                                        }));
                                    }}
                                />
                                {step.type === 'cards-single' && fieldErrors[step.field] && (
                                    <small className="text-danger d-block mt-2">{fieldErrors[step.field]}</small>
                                )}
                                {step.type === 'cards-multi' && fieldErrors[step.field] && (
                                    <small className="text-danger d-block mt-2">{fieldErrors[step.field]}</small>
                                )}
                                {step.type === 'cargo-details' && fieldErrors.container_type && (
                                    <small className="text-danger d-block mt-2">{fieldErrors.container_type}</small>
                                )}
                                {step.field && !['cards-single', 'cards-multi', 'title-description', 'contact', 'cargo-details', 'origin-destination', 'country-city'].includes(step.type) && fieldErrors[step.field] && (
                                    <small className="text-danger d-block mt-2">{fieldErrors[step.field]}</small>
                                )}
                            </div>
                            {step.type !== 'review' && !AUTO_ADVANCE_TYPES.has(step.type) && (
                                <button
                                    type="button"
                                    className="btn btn--base job-flow-continue"
                                    onClick={() => completeStepHandler(step)}
                                >
                                    {tx('Continue')}
                                </button>
                            )}
                        </section>
                    );
                })}
            </div>

            {!isBuyer && form.errors.email && (
                <p className="text-danger text-center mt-3">
                    {form.errors.email}{' '}
                    <Link href={routes?.buyerLogin ?? '/customer/login'}>Log in</Link>
                </p>
            )}
        </div>
    );
}
