import { Link } from '@inertiajs/react';
import { adminGoBack } from '@/utils/adminBack';

/**
 * Shared back control for provider/buyer dashboard nested pages.
 * Uses the same visible hover styles as admin-back-btn.
 */
export default function PortalBackLink({
    href,
    label = 'Back',
    className = 'btn btn-sm btn-outline--dark admin-back-btn',
}) {
    if (!href) return null;

    return (
        <Link href={href} onClick={(e) => adminGoBack(e, href)} className={className}>
            <i className="la la-undo" /> {label}
        </Link>
    );
}
