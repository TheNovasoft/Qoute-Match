export function isFreightCategory(categoryId, categories = []) {
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

export function valuesFromFields(fields = []) {
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

export function stepIsVisible(step, data) {
    if (step.showWhen?.field) {
        return step.showWhen.values.includes(data[step.showWhen.field]);
    }
    if (step.skipWhen?.(data)) {
        return false;
    }
    return true;
}

export function buildFlowSteps(categories, categoryForms, categoryId, { includeContact = true } = {}) {
    const steps = [
        {
            id: 'category',
            question: 'What do you need help with?',
            hint: 'Choose the category that best matches your job.',
            type: 'category',
        },
        {
            id: 'subcategory',
            question: 'Which speciality fits your job?',
            hint: 'Pick the closest match.',
            type: 'subcategory',
            skipWhen: (data) => {
                const cat = categories.find((c) => String(c.id) === String(data.category_id));
                return !cat || (cat.subcategories || []).length === 0;
            },
        },
    ];

    const dynamicFields = categoryForms?.[categoryId] || [];
    const groupedCityLabels = new Set();
    const consumedLabels = new Set();
    const countryPairs = [];

    dynamicFields.forEach((field) => {
        if (field.type === 'city' && field.locationGroup) {
            groupedCityLabels.add(field.label);
        }
    });

    dynamicFields.forEach((field) => {
        if (groupedCityLabels.has(field.label) || consumedLabels.has(field.label) || isSkippedField(field)) {
            return;
        }

        const showWhen = field.showWhen?.field ? field.showWhen : null;
        const base = { showWhen, required: field.isRequired };

        if (field.label === 'hs_code') {
            const weightField = dynamicFields.find((item) => item.label === 'gross_weight_kg');
            const cbmField = dynamicFields.find((item) => item.type === 'cbm');
            if (weightField && cbmField) {
                steps.push({
                    ...base,
                    id: 'dynamic-cargo-details',
                    question: 'Tell us about your cargo',
                    hint: field.instruction || 'Container type, HS code, weight and dimensions help providers quote accurately.',
                    type: 'cargo-details',
                    hsField: field.label,
                    weightField: weightField.label,
                    cbmField: cbmField.label,
                    hsMeta: field,
                    weightMeta: weightField,
                    cbmMeta: cbmField,
                    includeContainerType: isFreightCategory(categoryId, categories) && !hasContainerTypeField(dynamicFields),
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
            if (cityField) {
                consumedLabels.add(cityField.label);
            }
            countryPairs.push({
                ...base,
                locationGroup: field.locationGroup || field.label,
                countryField: field.label,
                cityField: cityField?.label || null,
                required: field.isRequired || cityField?.isRequired,
            });
            return;
        }

        const question = field.name;
        const hint = field.instruction || '';

        if (['radio', 'select'].includes(field.type) && field.options?.length) {
            steps.push({
                ...base,
                id: `dynamic-${field.label}`,
                question,
                hint,
                type: 'cards-single',
                field: field.label,
                options: field.options.map((opt) => ({ value: opt, label: opt })),
            });
        } else if (field.type === 'checkbox' && field.options?.length) {
            steps.push({
                ...base,
                id: `dynamic-${field.label}`,
                question,
                hint,
                type: 'cards-multi',
                field: field.label,
                options: field.options.map((opt) => ({ value: opt, label: opt })),
            });
        } else if (field.type === 'textarea') {
            steps.push({ ...base, id: `dynamic-${field.label}`, question, hint, type: 'textarea', field: field.label });
        } else if (field.type === 'file') {
            steps.push({ ...base, id: `dynamic-${field.label}`, question, hint, type: 'file', field: field.label, extensions: field.extensions });
        } else if (field.type === 'cbm') {
            steps.push({ ...base, id: `dynamic-${field.label}`, question, hint, type: 'cbm', field: field.label, optional: !field.isRequired });
        } else {
            steps.push({
                ...base,
                id: `dynamic-${field.label}`,
                question,
                hint,
                type: field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text',
                field: field.label,
            });
        }
    });

    const origin = countryPairs.find((item) => item.locationGroup === 'origin');
    const destination = countryPairs.find((item) => item.locationGroup === 'destination');
    if (origin && destination) {
        steps.push({
            id: 'dynamic-shipment-route',
            question: 'Where is the shipment going?',
            hint: '',
            type: 'origin-destination',
            origin,
            destination,
            required: origin.required || destination.required,
        });
    } else {
        countryPairs.forEach((pair) => {
            steps.push({
                ...pair,
                id: `dynamic-${pair.locationGroup || pair.countryField}`,
                question: pair.locationGroup === 'origin'
                    ? 'Where is this shipment coming from?'
                    : 'Where should this shipment go?',
                hint: 'Select the country first, then the city.',
                type: 'country-city',
                countryField: pair.countryField,
                cityField: pair.cityField,
            });
        });
    }

    steps.push({
        id: 'title-description',
        question: 'Job title & description',
        hint: 'Review the suggested title and description — edit either if you like.',
        type: 'title-description',
    });

    if (includeContact && !isFreightCategory(categoryId, categories)) {
        steps.push({
            id: 'contact',
            question: 'Your contact details',
            hint: 'We\'ll use this to create your account when you publish — no password needed here. Already a member? Log in instead.',
            type: 'contact',
        });
    }

    steps.push({
        id: 'review',
        question: 'Review and post',
        hint: 'Check everything looks right, then post your job.',
        type: 'review',
    });

    return steps;
}

export function stepIsValid(step, data) {
    if (step.type === 'review') {
        return true;
    }
    if (step.type === 'category') {
        return Boolean(data.category_id);
    }
    if (step.type === 'subcategory') {
        return Boolean(data.subcategory_id);
    }
    if (step.type === 'title-description') {
        return Boolean(String(data.title || '').trim() && String(data.description || '').trim());
    }
    if (step.type === 'title') {
        return Boolean(String(data.title || '').trim());
    }
    if (step.type === 'description') {
        return Boolean(String(data.description || '').trim());
    }
    if (step.type === 'skills') {
        return Array.isArray(data.skill_ids) && data.skill_ids.length > 0;
    }
    if (step.type === 'contact') {
        return Boolean(data.firstname?.trim() && data.email?.trim());
    }
    if (step.type === 'name-split') {
        return Boolean(data.firstname?.trim() && data.lastname?.trim());
    }
    if (step.type === 'country-city') {
        if (!step.required) {
            return true;
        }
        return Boolean(data[step.countryField]?.trim() && data[step.cityField]?.trim());
    }
    if (step.type === 'origin-destination') {
        if (!step.required) {
            return true;
        }
        const originOk = Boolean(
            data[step.origin.countryField]?.trim() && data[step.origin.cityField]?.trim(),
        );
        const destOk = Boolean(
            data[step.destination.countryField]?.trim() && data[step.destination.cityField]?.trim(),
        );
        return originOk && destOk;
    }
    if (step.type === 'cargo-details') {
        const containerOk = !step.includeContainerType || Boolean(data.container_type);
        const hsOk = !step.hsMeta?.isRequired || Boolean(String(data[step.hsField] ?? '').trim());
        const weightVal = data[step.weightField];
        const weightOk = !step.weightMeta?.isRequired || (weightVal !== '' && weightVal != null);
        const cbmOk = !step.cbmMeta?.isRequired || Boolean(String(data[step.cbmField] ?? '').trim());
        return containerOk && hsOk && weightOk && cbmOk;
    }
    if (step.optional || step.required === false) {
        return true;
    }
    const field = step.field;
    const value = data[field];
    if (step.type === 'cards-multi') {
        return (Array.isArray(value) ? value : []).length >= (step.minSelections ?? 1);
    }
    if (step.type === 'file') {
        return step.required ? Boolean(value) : true;
    }
    if (!field) {
        return true;
    }
    return value !== '' && value != null;
}

export function summarizeStep(step, data, categories) {
    const category = categories.find((c) => String(c.id) === String(data.category_id));
    const sub = category?.subcategories?.find((s) => String(s.id) === String(data.subcategory_id));

    switch (step.type) {
        case 'category':
            return category?.name || '—';
        case 'subcategory':
            return sub?.name || '—';
        case 'title-description':
            return `${data.title || '—'} — ${String(data.description || '').slice(0, 100)}${String(data.description || '').length > 100 ? '…' : ''}`;
        case 'title':
            return data.title || '—';
        case 'description':
            return `${String(data.description || '').slice(0, 140)}${String(data.description || '').length > 140 ? '…' : ''}` || '—';
        case 'skills': {
            const ids = (data.skill_ids || []).map((id) => Number(id)).filter(Boolean);
            if (!ids.length) {
                return '0 skill(s) selected';
            }
            return `${ids.length} skill(s) selected`;
        }
        case 'contact':
            return `${data.firstname || ''} · ${data.email || ''}`.trim();
        case 'cards-single':
            return data[step.field] || '—';
        case 'cards-multi':
            return (data[step.field] || []).join(', ') || '—';
        case 'country-city':
            return [data[step.countryField], data[step.cityField]].filter(Boolean).join(', ') || '—';
        case 'origin-destination': {
            const from = [data[step.origin.countryField], data[step.origin.cityField]].filter(Boolean).join(', ');
            const to = [data[step.destination.countryField], data[step.destination.cityField]].filter(Boolean).join(', ');
            return `${from || '—'} → ${to || '—'}`;
        }
        case 'cargo-details':
            return [data[step.hsField], data[step.weightField] ? `${data[step.weightField]} kg` : ''].filter(Boolean).join(' · ') || '—';
        case 'cbm':
            return data[step.field] ? String(data[step.field]).slice(0, 80) : '—';
        case 'file':
            return data[step.field] ? 'File attached' : '—';
        case 'textarea':
        case 'text':
        case 'number':
        case 'email':
        case 'date':
            return data[step.field] || '—';
        default:
            return '—';
    }
}

function isInternalNotesField(field) {
    const name = (field?.name || '').toLowerCase();
    const label = (field?.label || '').toLowerCase().replace(/_/g, ' ');
    return name.includes('additional requirement')
        || label.includes('additional requirement')
        || name.includes('other note')
        || label.includes('other note');
}

function isSkippedField(field) {
    if (isInternalNotesField(field)) {
        return true;
    }
    const name = (field?.name || '').toLowerCase();
    const label = (field?.label || '').toLowerCase().replace(/_/g, ' ');
    if (name.includes('property type') || label.includes('property type')) {
        return true;
    }
    if (name.includes('timeline') || name.includes('urgency') || label.includes('project timeline')) {
        return true;
    }
    return false;
}

function isEmptyValue(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return false;
}

function isTrivialValue(value) {
    const text = String(Array.isArray(value) ? value.join(', ') : value).trim().toLowerCase();
    return text === '' || text === 'no' || text === 'n/a' || text === 'none' || text === '-' || text === 'na';
}

function displayValue(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean).join(', ');
    }
    return String(value).trim();
}

function capitalizeWords(text) {
    return String(text)
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function cleanBrief(text) {
    let brief = String(text || '').trim().replace(/\s+/g, ' ');
    if (!brief) {
        return '';
    }

    brief = brief.replace(/^(i need|i want|looking for|need help with|need|want)\s+/i, '');
    brief = brief.replace(/\b(the|a|an|from|for|in|at|to|my|your)\s*$/i, '').trim();
    brief = brief.replace(/\b(from|for|in|at)\s+(the|a|an|my)?\s*$/i, '').trim();

    if (brief) {
        brief = brief.charAt(0).toUpperCase() + brief.slice(1);
    }

    return brief;
}

function wordsOverlap(a, b) {
    const aWords = String(a).toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    const bWords = String(b).toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    if (!aWords.length || !bWords.length) {
        return 0;
    }
    const shared = bWords.filter((word) => aWords.includes(word)).length;
    return shared / bWords.length;
}

function getDynamicContext(data, categoryForms, categoryId) {
    const fields = categoryForms?.[categoryId] || [];
    const context = {
        postcode: '',
        platform: '',
        location: '',
        origin: '',
        destination: '',
        originDestination: '',
        extras: [],
    };

    const routePart = (group) => {
        const countryField = fields.find((f) => f.type === 'country' && f.locationGroup === group);
        const cityField = fields.find((f) => f.type === 'city' && f.locationGroup === group);
        if (!countryField) {
            return '';
        }
        return [data[countryField.label], cityField ? data[cityField.label] : '']
            .filter(Boolean)
            .join(', ');
    };

    context.origin = routePart('origin');
    context.destination = routePart('destination');

    fields.forEach((field) => {
        if (isSkippedField(field)) {
            return;
        }
        if (field.type === 'country' || field.type === 'city') {
            return;
        }

        const value = data[field.label];
        if (isEmptyValue(value) || isTrivialValue(value)) {
            return;
        }

        const text = displayValue(value);
        const name = (field.name || field.label || '').toLowerCase();

        if (name.includes('postcode') || name.includes('post code') || name.includes('zip')) {
            context.postcode = text;
            return;
        }
        if (name.includes('platform') || name.includes('technology') || name.includes('framework')) {
            context.platform = text;
            return;
        }
        if (name.includes('location') || name.includes('address')) {
            context.location = text;
            return;
        }

        context.extras.push({ name: field.name || field.label, value: text });
    });

    if (context.origin && context.destination) {
        context.originDestination = `${context.origin} to ${context.destination}`;
    }

    return context;
}

function sentenceCase(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
        return '';
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function timelinePhrase(timeline) {
    const value = String(timeline || '').trim().toLowerCase();
    if (!value) {
        return '';
    }
    if (value === 'asap' || value.includes('as soon')) {
        return 'as soon as possible';
    }
    if (value.includes('week')) {
        return `within ${timeline}`;
    }
    return timeline;
}

function collectKeywords(data, categories, categoryForms) {
    const category = categories.find((c) => String(c.id) === String(data.category_id));
    const sub = category?.subcategories?.find((s) => String(s.id) === String(data.subcategory_id));
    const parts = [
        category?.name,
        sub?.name,
        data.container_type,
    ];

    const fields = categoryForms?.[data.category_id] || [];
    fields.forEach((field) => {
        if (isSkippedField(field)) {
            return;
        }
        const val = data[field.label];
        if (Array.isArray(val)) {
            parts.push(...val);
        } else if (val) {
            parts.push(String(val));
        }
    });

    return parts.filter(Boolean).join(' ').toLowerCase();
}

export function generateTitle(data, categories, categoryForms = {}) {
    const category = categories.find((c) => String(c.id) === String(data.category_id));
    const sub = category?.subcategories?.find((s) => String(s.id) === String(data.subcategory_id));
    const serviceName = sub?.name || category?.name || 'Project';
    const context = getDynamicContext(data, categoryForms, data.category_id);

    if (data.container_type) {
        const container = String(data.container_type).replace(/\(.*\)/, '').trim();
        return capitalizeWords(`${container} ${serviceName}`).slice(0, 70);
    }

    if (context.platform) {
        return capitalizeWords(`${context.platform} ${serviceName}`).slice(0, 70);
    }

    const originDest = context.originDestination;
    if (originDest) {
        return `${originDest} ${serviceName}`.slice(0, 70);
    }

    if (context.postcode) {
        return `${serviceName} — ${context.postcode}`.slice(0, 70);
    }

    return `${serviceName} Specialist Needed`.slice(0, 70);
}

function naturalFieldSentence(name, value) {
    const label = String(name || '').toLowerCase();
    const text = displayValue(value);

    if (label.includes('postcode') || label.includes('post code')) {
        return `The job site is in postcode ${text}.`;
    }
    if (label.includes('property type')) {
        return `The property type is a ${text.toLowerCase()}.`;
    }
    if (label.includes('timeline') || label.includes('urgency')) {
        return `My preferred start/completion window is ${timelinePhrase(text) || text.toLowerCase()}.`;
    }
    if (label.includes('access') || label.includes('parking')) {
        return `Please note regarding access: ${text}.`;
    }
    if (label.includes('material')) {
        return `Materials preference: ${text}.`;
    }
    return `${sentenceCase(name)} is ${text}.`;
}

function experienceLabel(level) {
    return ({ 1: 'professional', 2: 'expert-level', 3: 'intermediate', 4: 'entry-level' }[String(level)] || 'experienced');
}

function scopeLabel(scope) {
    return ({ 1: 'a larger', 2: 'a medium-sized', 3: 'a smaller' }[String(scope)] || 'a');
}

function longevityLabel(longevity) {
    return ({
        1: 'less than one week',
        2: 'less than one month',
        3: 'one to three months',
        4: 'three to six months',
    }[String(longevity)] || 'flexible');
}

export function generateDescription(data, categories, categoryForms) {
    const category = categories.find((c) => String(c.id) === String(data.category_id));
    const sub = category?.subcategories?.find((s) => String(s.id) === String(data.subcategory_id));
    const serviceLabel = sub?.name || category?.name || 'this project';
    const categoryPath = [category?.name, sub?.name].filter(Boolean).join(' › ');
    const context = getDynamicContext(data, categoryForms, data.category_id);
    const paragraphs = [];

    paragraphs.push(
        `I'm looking to hire a qualified professional for ${serviceLabel.toLowerCase()} `
        + `(category: ${categoryPath || serviceLabel}). `
        + 'Please review the details below and send a competitive quote.',
    );

    const scopeParts = [];

    if (context.origin && context.destination) {
        scopeParts.push(`The shipment route is from ${context.origin} to ${context.destination}.`);
    } else if (context.origin) {
        scopeParts.push(`Origin: ${context.origin}.`);
    } else if (context.destination) {
        scopeParts.push(`Destination: ${context.destination}.`);
    }

    if (context.postcode) {
        scopeParts.push(`The job location postcode is ${context.postcode}.`);
    }

    if (context.location) {
        scopeParts.push(`Additional location details: ${context.location}.`);
    }

    if (context.platform) {
        scopeParts.push(`Preferred platform/technology: ${context.platform}.`);
    }

    if (data.container_type) {
        scopeParts.push(
            `Container requirement: ${data.container_type}. `
            + 'Please factor in loading, documentation, and any applicable freight charges.',
        );
    }

    context.extras.forEach((item) => {
        scopeParts.push(naturalFieldSentence(item.name, item.value));
    });

    if (scopeParts.length) {
        paragraphs.push(scopeParts.join(' '));
    }

    paragraphs.push(
        'When you respond, please include:\n'
        + '• Your estimated price and what is included\n'
        + '• How soon you can start and expected completion time\n'
        + '• Relevant experience with similar jobs\n'
        + '• Any questions about access, materials, cargo details, or site conditions',
    );

    paragraphs.push('Thank you — I look forward to reviewing your quote.');

    return paragraphs.join('\n\n').trim();
}

export function skillsForCategory(skills = [], categoryId) {
    const id = Number(categoryId);
    if (!id) {
        return skills;
    }
    const matched = skills.filter(
        (skill) => !skill.category_id || Number(skill.category_id) === id,
    );
    if (matched.length) {
        return matched;
    }
    return skills.filter((skill) => !skill.category_id);
}

export function suggestSkillIds(data, skills = [], categories = [], categoryForms = {}) {
    const categoryId = Number(data.category_id);
    const pool = skillsForCategory(skills, categoryId);
    const keywords = collectKeywords(data, categories, categoryForms);

    const scored = pool.map((skill) => {
        const name = skill.name.toLowerCase();
        let score = 0;
        if (keywords.includes(name)) {
            score += 10;
        }
        name.split(/\s+/).forEach((word) => {
            if (word.length > 2 && keywords.includes(word)) {
                score += 3;
            }
        });
        return { id: Number(skill.id), score };
    });

    let ids = scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((item) => item.id);

    if (!ids.length) {
        ids = pool.slice(0, 6).map((skill) => Number(skill.id));
    }

    return ids;
}

export function getStepsToClearFrom(stepId, steps) {
    const index = steps.findIndex((s) => s.id === stepId);
    if (index < 0) {
        return [];
    }
    return steps.slice(index + 1).map((s) => s.id);
}
