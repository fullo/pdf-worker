import '../css/app.css';

// Polyfill Map.prototype.getOrInsertComputed (TC39 upsert proposal)
// Required by pdfjs-dist 5.x, not yet available in all browsers
if (!Map.prototype.getOrInsertComputed) {
    Map.prototype.getOrInsertComputed = function <K, V>(key: K, callbackFn: (key: K) => V): V {
        if (this.has(key)) return this.get(key) as V;
        const value = callbackFn(key);
        this.set(key, value);
        return value;
    };
}

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
