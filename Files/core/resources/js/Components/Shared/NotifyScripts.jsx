import { useEffect } from 'react';
import { formatToastMessage } from '@/utils/friendlyMessages';

export default function NotifyScripts() {
    useEffect(() => {
        const css = [
            '/assets/global/css/iziToast.min.css',
            '/assets/global/css/iziToast_custom.css',
        ];
        css.forEach((href) => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }
        });

        const script = document.createElement('script');
        script.src = '/assets/global/js/iziToast.min.js';
        script.onload = () => {
            const colors = {
                success: '#28c76f',
                error: '#eb2222',
                warning: '#ff9f43',
                info: '#1e9ff2',
            };
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-times-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-exclamation-circle',
            };

            window.triggerToaster = (status, message, titleOverride) => {
                const formatted = formatToastMessage(status, message);
                window.iziToast[status]({
                    title: titleOverride || formatted.title || status.charAt(0).toUpperCase() + status.slice(1),
                    message: titleOverride ? message : formatted.message,
                    position: 'topRight',
                    backgroundColor: '#fff',
                    icon: icons[status],
                    iconColor: colors[status],
                    progressBarColor: colors[status],
                    titleSize: '1rem',
                    messageSize: '1rem',
                    titleColor: '#474747',
                    messageColor: '#a2a2a2',
                    transitionIn: 'bounceInLeft',
                    transitionOut: 'fadeOutRight',
                });
            };

            window.notify = (status, message) => {
                if (typeof message === 'string') {
                    window.triggerToaster(status, message);
                } else {
                    Object.values(message).flat().forEach((val) => window.triggerToaster(status, val));
                }
            };
        };
        document.body.appendChild(script);
    }, []);

    return null;
}
