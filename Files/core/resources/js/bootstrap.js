import axios from 'axios';
import { router } from '@inertiajs/react';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

const syncCsrfHeader = () => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
    }
};

syncCsrfHeader();

router.on('navigate', syncCsrfHeader);

router.on('invalid', (event) => {
    const status = event.detail.response?.status;
    if (status === 419) {
        event.preventDefault();
        window.location.reload();
        return;
    }
    if (status === 409) {
        const location =
            event.detail.response?.headers?.['x-inertia-location']
            ?? event.detail.response?.headers?.['X-Inertia-Location'];
        if (location) {
            event.preventDefault();
            window.location.href = location;
        }
    }
});
