import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export default function ModalOverlay({ show, onClose, children, centered = true, mobileFriendly = true }) {
    useEffect(() => {
        if (!show) {
            return undefined;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previous;
        };
    }, [show]);

    if (!show || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="modal custom--modal show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                overflowY: 'auto',
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget && onClose) {
                    onClose();
                }
            }}
        >
            <div
                className={`modal-dialog ${centered ? 'modal-dialog-centered' : ''}${mobileFriendly ? ' modal-dialog-scrollable modal-fullscreen-sm-down' : ''}`}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
