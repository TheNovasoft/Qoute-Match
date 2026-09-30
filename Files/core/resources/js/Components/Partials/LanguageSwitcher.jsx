import { usePage } from '@inertiajs/react';

/**
 * Compact header toggle: shows "UR" while English is active, "ENG" while Urdu is active.
 */
export default function LanguageSwitcher({ className = '' }) {
    const { locale, site, routes } = usePage().props;

    if (!site?.multiLanguage) {
        return null;
    }

    const languages = locale?.languages ?? [];
    const currentCode = (locale?.current ?? 'en').toLowerCase();
    const hasUrdu = languages.some((lang) => lang.code === 'ur');
    const hasEnglish = languages.some((lang) => lang.code === 'en');

    if (!hasUrdu || !hasEnglish) {
        return null;
    }

    const isUrdu = currentCode === 'ur';
    const targetCode = isUrdu ? 'en' : 'ur';
    const label = isUrdu ? 'ENG' : 'UR';
    const base = routes?.changeLang ?? '/change';
    const href = `${base}/${targetCode}`;

    return (
        <a
            href={href}
            className={`header-lang-toggle${className ? ` ${className}` : ''}`}
            data-no-translate="1"
            aria-label={isUrdu ? 'انگریزی پر جائیں' : 'Switch to Urdu'}
            title={isUrdu ? 'انگریزی پر جائیں' : 'Switch to Urdu'}
        >
            {label}
        </a>
    );
}
