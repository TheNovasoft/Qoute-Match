import { usePage } from '@inertiajs/react';
import { useState } from 'react';

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

export default function TranslatableField({
    as = 'input',
    value = '',
    onChange,
    className = '',
    rows = 5,
    ...props
}) {
    const { locale } = usePage().props;
    const targetLang = locale?.current === 'en' ? 'ur' : 'en';
    const [showTranslation, setShowTranslation] = useState(false);
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleTranslation = async () => {
        if (showTranslation) {
            setShowTranslation(false);
            return;
        }

        if (!String(value || '').trim()) {
            return;
        }

        setError('');

        if (!translation) {
            setLoading(true);
            try {
                const response = await fetch('/tools/translate', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        text: value,
                        to: targetLang,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Translation failed');
                }

                const data = await response.json();
                setTranslation(data.translation || '');
            } catch (translateError) {
                setError('Could not translate. Try again.');
                setLoading(false);
                return;
            }
            setLoading(false);
        }

        setShowTranslation(true);
    };

    const displayValue = showTranslation ? translation : value;
    const sharedProps = {
        ...props,
        className,
        value: displayValue,
        onChange: (event) => {
            if (showTranslation) {
                setShowTranslation(false);
            }
            onChange(event);
        },
    };

    return (
        <div className="translatable-field">
            <div className="translatable-field__control">
                {as === 'textarea' ? (
                    <textarea rows={rows} {...sharedProps} />
                ) : (
                    <input {...sharedProps} />
                )}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary translatable-field__btn"
                    onClick={toggleTranslation}
                    disabled={loading || !String(value || '').trim()}
                    title={showTranslation ? 'Show original text' : 'Translate text'}
                >
                    {loading ? '…' : showTranslation ? 'Original' : 'Translate'}
                </button>
            </div>
            {error && <small className="text-danger d-block mt-1">{error}</small>}
            {showTranslation && translation && (
                <small className="text-muted d-block mt-1">
                    Showing translation ({targetLang.toUpperCase()}). Tap Original to edit your text.
                </small>
            )}
        </div>
    );
}
