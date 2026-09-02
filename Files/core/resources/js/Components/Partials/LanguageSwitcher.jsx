import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function LanguageSwitcher({ className = '' }) {
    const { locale, site, routes } = usePage().props;
    const [open, setOpen] = useState(false);

    const languages = locale?.languages ?? [];
    const currentCode = locale?.current ?? 'en';

    const currentLang = useMemo(
        () => languages.find((lang) => lang.code === currentCode) ?? languages[0],
        [languages, currentCode],
    );

    if (!site?.multiLanguage || languages.length <= 1) {
        return null;
    }

    const langUrl = (code) => {
        const base = routes?.changeLang ?? '/change';
        return `${base}/${code}`;
    };

    const flagUrl = (lang) => lang.imageUrl || null;

    return (
        <div className={`header-lang-switcher ${className}${open ? ' is-open' : ''}`}>
            <button
                type="button"
                className="header-lang-switcher__toggle"
                aria-expanded={open}
                aria-label="Change language"
                onClick={() => setOpen((value) => !value)}
            >
                <i className="las la-globe" aria-hidden="true" />
                <span>{currentLang?.name ?? currentCode.toUpperCase()}</span>
                <i className="las la-angle-down" aria-hidden="true" />
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        className="header-lang-switcher__backdrop"
                        aria-label="Close language menu"
                        onClick={() => setOpen(false)}
                    />
                    <ul className="header-lang-switcher__menu">
                        {languages.map((lang) => (
                            <li key={lang.code}>
                                <a
                                    href={langUrl(lang.code)}
                                    className={`header-lang-switcher__option${lang.code === currentCode ? ' is-active' : ''}`}
                                    onClick={() => setOpen(false)}
                                >
                                    {flagUrl(lang) ? (
                                        <img src={flagUrl(lang)} alt="" className="header-lang-switcher__flag" />
                                    ) : (
                                        <span className="header-lang-switcher__flag header-lang-switcher__flag--placeholder">
                                            {lang.code.toUpperCase()}
                                        </span>
                                    )}
                                    <span>{lang.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
