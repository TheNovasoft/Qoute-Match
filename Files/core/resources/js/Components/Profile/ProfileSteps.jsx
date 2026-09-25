import { Link, usePage } from '@inertiajs/react';

export const profileSteps = [
    { key: 1, label: 'About & Skill', routeKey: 'userProfileSkill', minStep: 0 },
    { key: 2, label: 'Basic', routeKey: 'userProfileSetting', minStep: 1 },
    { key: 3, label: 'Education', routeKey: 'userProfileEducation', minStep: 2 },
    { key: 4, label: 'Portfolio', routeKey: 'userProfilePortfolio', minStep: 3 },
];

/** Next profile wizard URL from the provider's current step (0–3). */
export function profileContinueHref(routes, userStep) {
    const step = Number(userStep) || 0;
    const target = profileSteps.find((item) => item.minStep === step) ?? profileSteps[profileSteps.length - 1];
    const fallbacks = {
        userProfileSkill: '/provider/profile-skill',
        userProfileSetting: '/provider/profile-setting',
        userProfileEducation: '/provider/profile-education',
        userProfilePortfolio: '/provider/profile-portfolio',
    };

    return routes?.[target.routeKey] ?? fallbacks[target.routeKey] ?? '/provider/profile-skill';
}

export default function ProfileSteps({ currentRouteKey, userStep }) {
    const { routes } = usePage().props;

    return (
        <div className="mb-4">
            <h6 className="mb-3">Fill in the basics below. One portfolio is enough to go live and start bidding.</h6>
            <ul className="page-list pt-1">
                {profileSteps.map((step) => {
                    const href = routes?.[step.routeKey] ?? '#';
                    const unlocked = userStep >= step.minStep;
                    const isCurrent = step.routeKey === currentRouteKey;

                    return (
                        <li
                            key={step.key}
                            className={`nav-item ${userStep >= step.key || isCurrent ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                        >
                            {unlocked ? (
                                <Link className={`nav-link ${isCurrent ? 'active' : ''}`} href={href}>
                                    <span className="profile-item__title">{step.label}</span>
                                </Link>
                            ) : (
                                <span className="nav-link disabled">
                                    <span className="profile-item__title">{step.label}</span>
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export function ProfileErrors({ errors }) {
    const messages = Object.values(errors).flat();
    if (!messages.length) return null;

    return (
        <div className="alert alert-danger">
            <ul className="mb-0 ps-3">
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </div>
    );
}
