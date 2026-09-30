import { Link } from '@inertiajs/react';

export default function HeaderAuthLinks({ routes, auth, compact = false, labels = {} }) {
    const dashboardLabel = labels.dashboard || 'Dashboard';
    const joinLabel = labels.join || 'Join';

    if (auth?.buyer) {
        return (
            <Link
                href={routes.buyerHome}
                className={`btn btn-outline--base header-join-btn${compact ? ' btn--sm w-100' : ''}`}
            >
                {dashboardLabel}
            </Link>
        );
    }

    if (auth?.user) {
        return (
            <Link
                href={routes.userHome}
                className={`btn btn-outline--base header-join-btn${compact ? ' btn--sm w-100' : ''}`}
            >
                {dashboardLabel}
            </Link>
        );
    }

    return (
        <Link
            href={routes.buyerRegister}
            className={`btn btn-outline--base header-join-btn${compact ? ' btn--sm w-100' : ''}`}
        >
            {joinLabel}
        </Link>
    );
}
