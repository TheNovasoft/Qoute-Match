function addString(set, value) {
    const text = String(value ?? '').trim();
    if (text) {
        set.add(text);
    }
}

export function collectJobPostFormStrings({
    categories = [],
    categoryForms = {},
    steps = [],
    isBuyer = false,
    priorityFirst = true,
}) {
    const priority = new Set();
    const strings = new Set();

    if (priorityFirst) {
        [
            'Tell us what you need done',
            'Answer a few questions — your previous answers stay visible below and can be edited anytime.',
            'What do you need help with?',
            'Choose the category that best matches your job.',
            'Job title',
            'Job description',
            'From',
            'To',
            'Country',
            'City',
            'Select country',
            'Select city',
            'Select a country first',
            'Enter city',
            'Your name',
            'Email',
            'Phone (optional)',
            'Already a member?',
            'Log in to your account',
            'Continue',
            'Edit',
            'Posting…',
            isBuyer ? 'Post job' : 'Post job free',
        ].forEach((text) => addString(priority, text));

        steps.slice(0, 3).forEach((step) => {
            addString(priority, step.question);
            addString(priority, step.hint);
            step.options?.forEach((option) => addString(priority, option.label));
        });

        categories.forEach((category) => {
            addString(priority, category.name);
        });
    }

    steps.forEach((step) => {
        addString(strings, step.question);
        addString(strings, step.hint);
        step.options?.forEach((option) => addString(strings, option.label));
    });

    categories.forEach((category) => {
        addString(strings, category.name);
        category.subcategories?.forEach((sub) => addString(strings, sub.name));
    });

    Object.values(categoryForms).flat().forEach((field) => {
        addString(strings, field.name);
        addString(strings, field.instruction);
        field.options?.forEach((option) => addString(strings, option));
    });

    [
        'Tell us what you need done',
        'Answer a few questions — your previous answers stay visible below and can be edited anytime.',
        'What do you need help with?',
        'Choose the category that best matches your job.',
        'Job title',
        'Job description',
        'From',
        'To',
        'Country',
        'City',
        'Select country',
        'Select city',
        'Select a country first',
        'Enter city',
        'Your name',
        'Email',
        'Phone (optional)',
        'Already a member?',
        'Log in to your account',
        'Container type',
        'Full Container (FCL)',
        'LCL (Less than Container Load)',
        'HS code',
        'Weight (kg)',
        'Continue',
        'Edit',
        'Posting…',
        'Translate form',
        'Show original',
        'Translating form…',
        isBuyer ? 'Post job' : 'Post job free',
        'Dimensions',
        'Unit of measure',
        'Length',
        'Width',
        'Height',
        'Quantity',
        'Weight',
        'Calculate CBM',
        'CBM',
        'Volume (Cubic Meter)',
        'Volume (Cubic Feet)',
        'Volumetric weight (kg)',
        'Live calculation unavailable. Showing local estimate.',
    ].forEach((text) => addString(strings, text));

    if (!priorityFirst) {
        return [...strings];
    }

    const ordered = [...priority];
    strings.forEach((text) => {
        if (!priority.has(text)) {
            ordered.push(text);
        }
    });

    return ordered;
}
