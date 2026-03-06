import './bootstrap';
import '../css/app.css';

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { i18nVue } from 'laravel-vue-i18n';

const appName = 'PDF Worker';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob('./Pages/**/*.vue'),
        ) as any,
    setup({ el, App, props, plugin }) {
        const app = createApp({ render: () => h(App, props) });

        app.use(plugin);
        app.use(i18nVue, {
            resolve: async (lang: string) => {
                const langs = import.meta.glob('../../lang/*.json');
                const key = `../../lang/${lang}.json`;
                if (langs[key]) {
                    return await langs[key]();
                }
                return {};
            },
        });

        app.mount(el);
    },
    progress: {
        color: '#e5322d',
    },
});
