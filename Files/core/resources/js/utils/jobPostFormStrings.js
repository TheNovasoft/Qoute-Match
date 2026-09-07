import { CBM_UI_STRINGS } from '@/utils/jobPostCbmStrings';
import { JOB_POST_DYNAMIC_FORM_STRINGS } from '@/utils/jobPostDynamicFormStrings';
import { JOB_POST_FLOW_UI_STRINGS } from '@/utils/jobPostFlowUiStrings';
import { JOB_POST_SUCCESS_STRINGS } from '@/utils/jobPostSuccessStrings';
import { ALL_VALIDATION_MESSAGES } from '@/utils/jobPostValidationMessages';

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

    ALL_VALIDATION_MESSAGES.forEach((text) => addString(strings, text));
    CBM_UI_STRINGS.forEach((text) => addString(strings, text));
    JOB_POST_FLOW_UI_STRINGS.forEach((text) => addString(strings, text));
    JOB_POST_DYNAMIC_FORM_STRINGS.forEach((text) => addString(strings, text));
    JOB_POST_SUCCESS_STRINGS.forEach((text) => addString(strings, text));

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

        ALL_VALIDATION_MESSAGES.forEach((text) => addString(priority, text));
        JOB_POST_FLOW_UI_STRINGS.forEach((text) => addString(priority, text));
        JOB_POST_DYNAMIC_FORM_STRINGS.forEach((text) => addString(priority, text));
        JOB_POST_SUCCESS_STRINGS.forEach((text) => addString(priority, text));

        steps.forEach((step) => {
            addString(priority, step.question);
            addString(priority, step.hint);
            step.options?.forEach((option) => addString(priority, option.label));
        });

        categories.forEach((category) => {
            addString(priority, category.name);
            category.subcategories?.forEach((sub) => addString(priority, sub.name));
        });

        CBM_UI_STRINGS.slice(0, 12).forEach((text) => addString(priority, text));
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
        'Could not translate. Try again.',
        'Translation service is busy. Form labels are shown in Urdu where available.',
        isBuyer ? 'Post job' : 'Post job free',
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
