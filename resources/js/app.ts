import '../css/app.css';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { i18nPlugin, currentLocale } from './i18n';
import { initDarkMode } from './Composables/useDarkMode';
import { useWebVitals } from './Composables/useWebVitals';

initDarkMode();

const app = createApp(App);
app.use(router);
app.use(i18nPlugin);
app.mount('#app');

// Set html lang to match detected/stored locale
document.documentElement.lang = currentLocale.value;

// Web Vitals monitoring (production only)
if (import.meta.env.PROD) {
    useWebVitals((metric) => {
        console.debug('[Web Vitals]', metric.name, metric.value.toFixed(2));
    });
}
