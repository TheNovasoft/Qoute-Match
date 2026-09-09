const DEFAULT_ROUTES = {
    buyerDeposit: '/customer/deposit',
    userDeposit: '/provider/deposit',
    buyerSupport: '/customer/ticket',
    userSupport: '/provider/ticket',
    buyerJobList: '/customer/job/post/index',
    userLeadCredits: '/provider/lead-credits',
    buyerLogin: '/customer/login',
};

function includesAny(text, needles) {
    const lower = text.toLowerCase();
    return needles.some((needle) => lower.includes(needle));
}

export function parseFriendlyError(message, routes = {}) {
    const mergedRoutes = { ...DEFAULT_ROUTES, ...routes };
    const text = String(message || '').trim();

    if (!text) {
        return {
            title: 'Something went wrong',
            message: 'We could not complete that action.',
            nextStep: 'Try again in a moment. If it keeps happening, contact support.',
        };
    }

    if (includesAny(text, ['insufficient balance', 'not enough money', 'deposit at least', 'wallet balance'])) {
        return {
            title: 'Not enough wallet balance',
            message: text
                .replace(/Insufficient balance\.?/i, 'Not enough money in your wallet.')
                .replace(/Deposit at least/i, 'Add at least')
                .replace(/deposit funds/i, 'add money'),
            nextStep: 'Add money to your wallet, then try again.',
            actionLabel: 'Add money',
            actionHref: mergedRoutes.buyerDeposit || mergedRoutes.userDeposit,
        };
    }

    if (includesAny(text, ['lead credit', 'quote token', 'purchase a credit'])) {
        return {
            title: 'Quote tokens needed',
            message: text.replace(/lead credits/i, 'quote tokens'),
            nextStep: 'Buy quote tokens or ask admin to grant welcome credits.',
            actionLabel: 'Get quote tokens',
            actionHref: mergedRoutes.userLeadCredits,
        };
    }

    if (includesAny(text, ['already hired', 'invalid action'])) {
        return {
            title: 'This job is already assigned',
            message: 'A provider has already been hired for this request.',
            nextStep: 'Open My Jobs to view the active project.',
            actionLabel: 'View my jobs',
            actionHref: mergedRoutes.buyerJobList,
        };
    }

    if (includesAny(text, ['unauthorized', 'login', 'sign in'])) {
        return {
            title: 'Please sign in',
            message: text,
            nextStep: 'Sign in to your account and try again.',
            actionLabel: 'Sign in',
            actionHref: mergedRoutes.buyerLogin,
        };
    }

    if (includesAny(text, ['please refresh', 'refresh and try', 'try again'])) {
        return {
            title: 'Something went wrong',
            message: text.replace(/please refresh and try again\.?/i, '').trim() || 'We could not finish that step.',
            nextStep: 'Check your details and try again. If the problem continues, contact support.',
            actionLabel: 'Get help',
            actionHref: mergedRoutes.buyerSupport || mergedRoutes.userSupport,
        };
    }

    if (includesAny(text, ['kyc', 'verify your identity', 'verification'])) {
        return {
            title: 'Identity verification required',
            message: text,
            nextStep: 'Complete identity verification, then retry this action.',
        };
    }

    if (includesAny(text, ['withdraw'])) {
        return {
            title: 'Withdrawal could not start',
            message: text.replace(/Insufficient balance for withdrawal/i, 'Your wallet balance is too low for this withdrawal.'),
            nextStep: 'Lower the amount or wait until more funds are available.',
        };
    }

    return {
        title: 'Something went wrong',
        message: text,
        nextStep: 'Review the details and try again. Contact support if you need help.',
        actionLabel: 'Get help',
        actionHref: mergedRoutes.buyerSupport || mergedRoutes.userSupport,
    };
}

export function formatToastMessage(status, message, routes = {}) {
    const text = String(message || '').trim();
    if (!text) {
        return { title: 'Notice', message: '' };
    }

    if (status === 'success') {
        const friendlySuccess = {
            'job post created successfully': 'Your job is saved. Providers can now send quotes.',
            'job post updated successfully': 'Your job details were updated.',
            'quote rejected successfully': 'Quote removed from your list.',
            'revision request sent': 'The provider received your revision request.',
        };
        const lower = text.toLowerCase();
        const matched = Object.entries(friendlySuccess).find(([key]) => lower.includes(key));
        return {
            title: 'Success',
            message: matched ? matched[1] : text,
        };
    }

    if (status === 'info') {
        return { title: 'Update', message: text };
    }

    if (status === 'warning') {
        return { title: 'Please check', message: text };
    }

    const parsed = parseFriendlyError(text, routes);
    const body = parsed.nextStep
        ? `${parsed.message} Next: ${parsed.nextStep}`
        : parsed.message;

    return {
        title: parsed.title,
        message: body,
    };
}

export function formatInboxNotification(subject, preview) {
    const cleanSubject = String(subject || 'New update').trim();
    const cleanPreview = String(preview || 'You have a new notification').trim();

    if (includesAny(cleanPreview, ['bid', 'quote'])) {
        return `${cleanSubject}: A provider sent a new quote — review and compare.`;
    }

    if (includesAny(cleanPreview, ['message', 'chat'])) {
        return `${cleanSubject}: You have a new message waiting.`;
    }

    if (includesAny(cleanPreview, ['project', 'hire', 'assigned'])) {
        return `${cleanSubject}: Your project status changed.`;
    }

    return `${cleanSubject}: ${cleanPreview}`;
}
