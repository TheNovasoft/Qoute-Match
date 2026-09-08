import ModalOverlay from '@/Components/Shared/ModalOverlay';

export default function ConfirmModal({
    show,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmClass = 'btn--base',
    onConfirm,
    onCancel,
    processing = false,
    children,
}) {
    return (
        <ModalOverlay show={show} onClose={processing ? undefined : onCancel}>
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">{title}</h5>
                    <button type="button" className="btn-close" onClick={onCancel} aria-label="Close" disabled={processing} />
                </div>
                <div className="modal-body">
                    {message && <p className="mb-0">{message}</p>}
                    {children}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn--dark btn-sm" onClick={onCancel} disabled={processing}>
                        {cancelLabel}
                    </button>
                    <button type="button" className={`btn btn-sm ${confirmClass}`} onClick={onConfirm} disabled={processing}>
                        {processing ? 'Please wait...' : confirmLabel}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
