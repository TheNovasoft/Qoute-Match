import { useEffect, useState } from 'react';
import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';
import { translateText } from '@/utils/translateClient';

export default function TranslatableText({
    text = '',
    className = '',
    as: Tag = 'span',
    line = false,
}) {
    const { targetLang, langLabel } = useJobPostFormTranslation();
    const [open, setOpen] = useState(false);
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setOpen(false);
        setTranslation('');
    }, [targetLang, text]);

    const original = String(text || '').trim();
    if (!original) {
        return null;
    }

    const toggle = async (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();

        if (open) {
            setOpen(false);
            return;
        }

        setLoading(true);
        try {
            const result = await translateText(original, targetLang);
            const translated = String(result || '').trim();

            if (!translated || /QUERY LENGTH LIMIT|MYMEMORY WARNING/i.test(translated)) {
                return;
            }

            setTranslation(translated);
            setOpen(true);
        } catch {
            // Keep original text silently on failure.
        } finally {
            setLoading(false);
        }
    };

    const display = open && translation ? translation : original;
    const Wrapper = line ? 'div' : 'span';

    return (
        <Wrapper className={`translatable-line${line ? ' translatable-line--block' : ''}${className ? ` ${className}` : ''}`.trim()}>
            <Tag className="translatable-line__text">{display}</Tag>
            <button
                type="button"
                className="translatable-line__btn"
                onClick={toggle}
                disabled={loading}
                title={open ? 'Show original' : `Translate to ${langLabel}`}
            >
                {loading ? '…' : open ? 'Original' : 'Translate'}
            </button>
        </Wrapper>
    );
}
