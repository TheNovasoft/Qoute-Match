import { VALIDATION_MSG } from '@/utils/jobPostValidationMessages';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

function trim(value) {
    return String(value ?? '').trim();
}

function isEmpty(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return false;
}

function setError(errors, field, message) {
    if (field && message && !errors[field]) {
        errors[field] = message;
    }
}

export function isCargoCbmRequired(step, data) {
    if (!step.cbmMeta?.isRequired) {
        return false;
    }

    const containerType = trim(data.container_type);
    if (step.includeContainerType || containerType) {
        return containerType === 'LCL';
    }

    return true;
}

export function validateStep(step, data) {
    const errors = {};

    if (step.type === 'review') {
        return { valid: true, errors };
    }

    if (step.type === 'category') {
        if (!data.category_id) {
            setError(errors, 'category_id', VALIDATION_MSG.CHOOSE_CATEGORY);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'subcategory') {
        if (!data.subcategory_id) {
            setError(errors, 'subcategory_id', VALIDATION_MSG.CHOOSE_SPECIALITY);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'title-description') {
        const title = trim(data.title);
        const description = trim(data.description);

        if (!title) {
            setError(errors, 'title', VALIDATION_MSG.TITLE_REQUIRED);
        } else if (title.length < 3) {
            setError(errors, 'title', VALIDATION_MSG.TITLE_MIN);
        } else if (title.length > 255) {
            setError(errors, 'title', VALIDATION_MSG.TITLE_MAX);
        }

        if (!description) {
            setError(errors, 'description', VALIDATION_MSG.DESCRIPTION_REQUIRED);
        } else if (description.length < 20) {
            setError(errors, 'description', VALIDATION_MSG.DESCRIPTION_MIN);
        }

        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'title') {
        if (!trim(data.title)) {
            setError(errors, 'title', VALIDATION_MSG.TITLE_REQUIRED);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'description') {
        if (!trim(data.description)) {
            setError(errors, 'description', VALIDATION_MSG.DESCRIPTION_REQUIRED);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'contact') {
        const name = trim(data.firstname);
        const email = trim(data.email);
        const phone = trim(data.phone);

        if (!name) {
            setError(errors, 'firstname', VALIDATION_MSG.NAME_REQUIRED);
        } else if (name.length > 40) {
            setError(errors, 'firstname', VALIDATION_MSG.NAME_MAX);
        }

        if (!email) {
            setError(errors, 'email', VALIDATION_MSG.EMAIL_REQUIRED);
        } else if (!EMAIL_RE.test(email)) {
            setError(errors, 'email', VALIDATION_MSG.EMAIL_INVALID);
        } else if (email.length > 100) {
            setError(errors, 'email', VALIDATION_MSG.EMAIL_MAX);
        }

        if (!phone) {
            setError(errors, 'phone', VALIDATION_MSG.PHONE_REQUIRED);
        } else if (phone.length > 30) {
            setError(errors, 'phone', VALIDATION_MSG.PHONE_MAX);
        }

        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'country-city') {
        if (step.required !== false) {
            if (!trim(data[step.countryField])) {
                setError(errors, step.countryField, VALIDATION_MSG.COUNTRY_REQUIRED);
            }
            if (!trim(data[step.cityField])) {
                setError(errors, step.cityField, VALIDATION_MSG.CITY_REQUIRED);
            }
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'origin-destination') {
        if (step.required !== false) {
            if (!trim(data[step.origin.countryField])) {
                setError(errors, step.origin.countryField, VALIDATION_MSG.ORIGIN_COUNTRY_REQUIRED);
            }
            if (!trim(data[step.origin.cityField])) {
                setError(errors, step.origin.cityField, VALIDATION_MSG.ORIGIN_CITY_REQUIRED);
            }
            if (!trim(data[step.destination.countryField])) {
                setError(errors, step.destination.countryField, VALIDATION_MSG.DESTINATION_COUNTRY_REQUIRED);
            }
            if (!trim(data[step.destination.cityField])) {
                setError(errors, step.destination.cityField, VALIDATION_MSG.DESTINATION_CITY_REQUIRED);
            }
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'cargo-details') {
        if (step.includeContainerType && !trim(data.container_type)) {
            setError(errors, 'container_type', VALIDATION_MSG.CONTAINER_REQUIRED);
        }

        if (step.hsMeta?.isRequired && !trim(data[step.hsField])) {
            setError(errors, step.hsField, VALIDATION_MSG.HS_REQUIRED);
        } else if (trim(data[step.hsField]) && !/^[\d.\s-]{2,20}$/.test(trim(data[step.hsField]))) {
            setError(errors, step.hsField, VALIDATION_MSG.HS_INVALID);
        }

        const weightRaw = data[step.weightField];
        const weightText = trim(weightRaw);
        if (step.weightMeta?.isRequired && weightText === '') {
            setError(errors, step.weightField, VALIDATION_MSG.WEIGHT_REQUIRED);
        } else if (weightText !== '' && (Number.isNaN(Number(weightRaw)) || Number(weightRaw) <= 0)) {
            setError(errors, step.weightField, VALIDATION_MSG.WEIGHT_INVALID);
        }

        if (isCargoCbmRequired(step, data) && !trim(data[step.cbmField])) {
            setError(errors, step.cbmField, VALIDATION_MSG.CBM_REQUIRED);
        }

        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.optional || step.required === false) {
        return { valid: true, errors };
    }

    const field = step.field;
    const value = data[field];

    if (step.type === 'cards-multi') {
        const selected = Array.isArray(value) ? value : [];
        if (selected.length < (step.minSelections ?? 1)) {
            setError(errors, field, VALIDATION_MSG.CHOOSE_ONE_OPTION);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'cards-single') {
        if (isEmpty(value)) {
            setError(errors, field, VALIDATION_MSG.CHOOSE_OPTION);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'file') {
        if (step.required && !value) {
            setError(errors, field, VALIDATION_MSG.FILE_REQUIRED);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (!field) {
        return { valid: true, errors };
    }

    if (step.type === 'email') {
        const email = trim(value);
        if (!email) {
            setError(errors, field, VALIDATION_MSG.FIELD_REQUIRED);
        } else if (!EMAIL_RE.test(email)) {
            setError(errors, field, VALIDATION_MSG.EMAIL_INVALID);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'number') {
        const text = trim(value);
        if (!text) {
            setError(errors, field, VALIDATION_MSG.FIELD_REQUIRED);
        } else if (Number.isNaN(Number(value))) {
            setError(errors, field, VALIDATION_MSG.NUMBER_INVALID);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'date') {
        if (!trim(value)) {
            setError(errors, field, VALIDATION_MSG.DATE_REQUIRED);
        } else if (Number.isNaN(Date.parse(value))) {
            setError(errors, field, VALIDATION_MSG.DATE_INVALID);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'textarea' || step.type === 'text') {
        const text = trim(value);
        if (!text) {
            setError(errors, field, VALIDATION_MSG.FIELD_REQUIRED);
        } else if (step.type === 'textarea' && text.length < 2) {
            setError(errors, field, VALIDATION_MSG.TEXTAREA_MIN);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'cbm') {
        if (!trim(value)) {
            setError(errors, field, VALIDATION_MSG.DIMENSIONS_REQUIRED);
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    const text = trim(value);
    if (!text) {
        setError(errors, field, VALIDATION_MSG.FIELD_REQUIRED);
    } else if (step.type === 'url' && !URL_RE.test(text)) {
        setError(errors, field, VALIDATION_MSG.URL_INVALID);
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

export function stepFieldKeys(step) {
    switch (step.type) {
        case 'title-description':
            return ['title', 'description'];
        case 'contact':
            return ['firstname', 'email', 'phone'];
        case 'country-city':
            return [step.countryField, step.cityField].filter(Boolean);
        case 'origin-destination':
            return [
                step.origin?.countryField,
                step.origin?.cityField,
                step.destination?.countryField,
                step.destination?.cityField,
            ].filter(Boolean);
        case 'cargo-details':
            return [
                step.includeContainerType ? 'container_type' : null,
                step.hsField,
                step.weightField,
                step.cbmField,
            ].filter(Boolean);
        default:
            return step.field ? [step.field] : [];
    }
}
