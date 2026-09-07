export const JOB_POST_SUCCESS_STRINGS = [
    'Your project is ready',
    'We saved your job details. Create a free account or log in to publish your project and start receiving quotes from providers.',
    'Your email',
    'will be used for your account.',
    'Your job has been posted',
    'Your job has been saved as a draft. Log in to your customer dashboard to publish it when you are ready.',
    'Your request is live on Find Jobs. Providers can now send you quotes. Check your email for confirmation and manage everything from your customer account.',
    'Thanks — your request is in review. You will get an email as soon as it is approved and appears on Find Jobs. Manage it anytime from your customer account.',
    'Create free account',
    'Log in',
    'View my jobs',
    'Browse requests',
    'Back to home',
];

export function collectJobPostSuccessStrings({ email = '', title = '' } = {}) {
    const strings = [...JOB_POST_SUCCESS_STRINGS];
    if (email) {
        strings.push(email);
    }
    if (title) {
        strings.push(title);
    }
    return strings;
}
