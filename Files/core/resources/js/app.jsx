import { createInertiaApp, Head, Link, progress, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import InertiaErrorBoundary from '@/Components/Shared/InertiaErrorBoundary';
import { bindAdminSidebarInertiaNav } from '@/utils/adminInertiaNav';
import { bindAdminSidebarSync } from '@/utils/adminSidebar';
import './bootstrap';

const appName = 'QuoteMatch';
const pageModules = import.meta.glob('./Pages/**/*.jsx');

const hidePreloader = () => {
    document.querySelectorAll('.preloader').forEach((el) => {
        el.style.display = 'none';
    });
};

const resetProgressBar = () => {
    try {
        if (typeof progress.isStarted === 'function' && progress.isStarted()) {
            progress.finish();
        } else if (typeof progress.reset === 'function') {
            progress.reset();
        }
    } catch {
        // ignore
    }
};

router.on('navigate', hidePreloader);
router.on('finish', () => {
    hidePreloader();
    resetProgressBar();
});
router.on('cancel', resetProgressBar);

router.on('error', (errors) => {
    console.error('Inertia navigation error:', errors);
    resetProgressBar();
});

router.on('exception', (event) => {
    console.error('Inertia exception:', event.detail?.exception);
    resetProgressBar();
});

bindAdminSidebarInertiaNav();
bindAdminSidebarSync(router);

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, pageModules).catch((error) => {
            console.error(`Failed to load page component: ${name}`, error);
            resetProgressBar();
            throw error;
        }),
    setup({ el, App, props }) {
        hidePreloader();
        createRoot(el).render(
            <InertiaErrorBoundary>
                <App {...props} />
            </InertiaErrorBoundary>,
        );
    },
    progress: {
        color: '#0071e3',
        delay: 250,
    },
});

export { Head, Link, router };
