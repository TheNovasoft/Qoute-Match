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

export function validateStep(step, data) {
    const errors = {};

    if (step.type === 'review') {
        return { valid: true, errors };
    }

    if (step.type === 'category') {
        if (!data.category_id) {
            setError(errors, 'category_id', 'Please choose a category.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'subcategory') {
        if (!data.subcategory_id) {
            setError(errors, 'subcategory_id', 'Please choose a speciality.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'title-description') {
        const title = trim(data.title);
        const description = trim(data.description);

        if (!title) {
            setError(errors, 'title', 'Job title is required.');
        } else if (title.length < 3) {
            setError(errors, 'title', 'Job title must be at least 3 characters.');
        } else if (title.length > 255) {
            setError(errors, 'title', 'Job title must be 255 characters or less.');
        }

        if (!description) {
            setError(errors, 'description', 'Job description is required.');
        } else if (description.length < 20) {
            setError(errors, 'description', 'Please add a bit more detail (at least 20 characters).');
        }

        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'title') {
        if (!trim(data.title)) {
            setError(errors, 'title', 'Job title is required.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'description') {
        if (!trim(data.description)) {
            setError(errors, 'description', 'Job description is required.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'contact') {
        const name = trim(data.firstname);
        const email = trim(data.email);
        const phone = trim(data.phone);

        if (!name) {
            setError(errors, 'firstname', 'Your name is required.');
        } else if (name.length > 40) {
            setError(errors, 'firstname', 'Name must be 40 characters or less.');
        }

        if (!email) {
            setError(errors, 'email', 'Email is required.');
        } else if (!EMAIL_RE.test(email)) {
            setError(errors, 'email', 'Please enter a valid email address.');
        } else if (email.length > 100) {
            setError(errors, 'email', 'Email must be 100 characters or less.');
        }

        if (phone && phone.length > 30) {
            setError(errors, 'phone', 'Phone must be 30 characters or less.');
        }

        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'country-city') {
        if (step.required !== false) {
            if (!trim(data[step.countryField])) {
                setError(errors, step.countryField, 'Please select a country.');
            }
            if (!trim(data[step.cityField])) {
                setError(errors, step.cityField, 'Please select or enter a city.');
            }
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'origin-destination') {
        if (step.required !== false) {
            if (!trim(data[step.origin.countryField])) {
                setError(errors, step.origin.countryField, 'Please select an origin country.');
            }
            if (!trim(data[step.origin.cityField])) {
                setError(errors, step.origin.cityField, 'Please select or enter an origin city.');
            }
            if (!trim(data[step.destination.countryField])) {
                setError(errors, step.destination.countryField, 'Please select a destination country.');
            }
            if (!trim(data[step.destination.cityField])) {
                setError(errors, step.destination.cityField, 'Please select or enter a destination city.');
            }
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'cargo-details') {
        if (step.includeContainerType && !trim(data.container_type)) {
            setError(errors, 'container_type', 'Please choose a container type.');
        }

        if (step.hsMeta?.isRequired && !trim(data[step.hsField])) {
            setError(errors, step.hsField, 'HS code is required.');
        } else if (trim(data[step.hsField]) && !/^[\d.\s-]{2,20}$/.test(trim(data[step.hsField]))) {
            setError(errors, step.hsField, 'Please enter a valid HS code.');
        }

        const weightRaw = data[step.weightField];
        const weightText = trim(weightRaw);
        if (step.weightMeta?.isRequired && weightText === '') {
            setError(errors, step.weightField, 'Weight is required.');
        } else if (weightText !== '' && (Number.isNaN(Number(weightRaw)) || Number(weightRaw) <= 0)) {
            setError(errors, step.weightField, 'Please enter a valid weight in kg.');
        }

        if (step.cbmMeta?.isRequired && !trim(data[step.cbmField])) {
            setError(errors, step.cbmField, 'Please enter cargo dimensions or volume.');
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
            setError(errors, field, 'Please choose at least one option.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'cards-single') {
        if (isEmpty(value)) {
            setError(errors, field, 'Please choose an option.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'file') {
        if (step.required && !value) {
            setError(errors, field, 'Please attach a file.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (!field) {
        return { valid: true, errors };
    }

    if (step.type === 'email') {
        const email = trim(value);
        if (!email) {
            setError(errors, field, 'This field is required.');
        } else if (!EMAIL_RE.test(email)) {
            setError(errors, field, 'Please enter a valid email address.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'number') {
        const text = trim(value);
        if (!text) {
            setError(errors, field, 'This field is required.');
        } else if (Number.isNaN(Number(value))) {
            setError(errors, field, 'Please enter a valid number.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'date') {
        if (!trim(value)) {
            setError(errors, field, 'Please choose a date.');
        } else if (Number.isNaN(Date.parse(value))) {
            setError(errors, field, 'Please enter a valid date.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'textarea' || step.type === 'text') {
        const text = trim(value);
        if (!text) {
            setError(errors, field, 'This field is required.');
        } else if (step.type === 'textarea' && text.length < 2) {
            setError(errors, field, 'Please enter at least 2 characters.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    if (step.type === 'cbm') {
        if (!trim(value)) {
            setError(errors, field, 'Please enter dimensions or volume.');
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    const text = trim(value);
    if (!text) {
        setError(errors, field, 'This field is required.');
    } else if (step.type === 'url' && !URL_RE.test(text)) {
        setError(errors, field, 'Please enter a valid URL (starting with http:// or https://).');
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
