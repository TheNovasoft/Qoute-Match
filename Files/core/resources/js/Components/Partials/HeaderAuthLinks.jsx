import { Link } from '@inertiajs/react';

export default function HeaderAuthLinks({ routes, auth, compact = false }) {
    if (auth?.buyer) {
        return (
            <Link
                href={routes.buyerHome}
                className={`btn btn-outline--base header-join-btn${compact ? ' btn--sm w-100' : ''}`}
            >
                Dashboard
            </Link>
        );
    }

    if (auth?.user) {
        return (
            <Link
                href={routes.userHome}
                className={`btn btn-outline--base header-join-btn${compact ? ' btn--sm w-100' : ''}`}
            >
                Dashboard
            </Link>
        );
    }

    return (
        <Link
            href={routes.buyerRegister}
            className={`btn btn-outline--base header-join-btn${compact ? ' btn--sm w-100' : ''}`}
        >
            Join
        </Link>
    );
}
