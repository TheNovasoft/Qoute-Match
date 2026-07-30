import { Link } from '@inertiajs/react';
import { adminGoBack } from '@/utils/adminBack';

export default function AdminBackLink({ href, label = '← Back', className = 'btn btn-sm btn-outline--dark admin-back-btn' }) {
    return (
        <Link href={href || '#'} onClick={(e) => adminGoBack(e, href)} className={className}>
            {label}
        </Link>
    );
}
