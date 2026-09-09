import { Link } from '@inertiajs/react';
import { parseFriendlyError } from '@/utils/friendlyMessages';

export default function FriendlyErrorAlert({
    message,
    routes = {},
    className = 'mb-3',
    onDismiss,
}) {
    if (!message) return null;

    const parsed = parseFriendlyError(message, routes);

    return (
        <div className={`alert alert-danger friendly-error-alert ${className}`.trim()} role="alert">
            <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                    <strong className="d-block mb-1">{parsed.title}</strong>
                    <p className="mb-2">{parsed.message}</p>
                    {parsed.nextStep && (
                        <p className="mb-0 small">
                            <strong>What to do next:</strong> {parsed.nextStep}
                        </p>
                    )}
                    {parsed.actionHref && parsed.actionLabel && (
                        <Link href={parsed.actionHref} className="btn btn-sm btn--base mt-3">
                            {parsed.actionLabel}
                        </Link>
                    )}
                </div>
                {onDismiss && (
                    <button type="button" className="btn-close" aria-label="Dismiss" onClick={onDismiss} />
                )}
            </div>
        </div>
    );
}
