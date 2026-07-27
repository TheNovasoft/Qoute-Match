import { createInertiaApp, Head, Link, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import InertiaErrorBoundary from '@/Components/Shared/InertiaErrorBoundary';
import './bootstrap';

const appName = 'QuoteMatch';

const hidePreloader = () => {
    document.querySelectorAll('.preloader').forEach((el) => {
        el.style.display = 'none';
    });
};

router.on('navigate', hidePreloader);
router.on('finish', hidePreloader);

router.on('error', (errors) => {
    console.error('Inertia navigation error:', errors);
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <InertiaErrorBoundary>
                <App {...props} />
            </InertiaErrorBoundary>,
        );
    },
    progress: {
        color: '#0071e3',
    },
});

export { Head, Link, router };
