import { ref, type Plugin } from 'vue';

import en from '../../lang/en.json';
import it from '../../lang/it.json';
import es from '../../lang/es.json';
import fr from '../../lang/fr.json';
import de from '../../lang/de.json';
import pt from '../../lang/pt.json';

const messages: Record<string, Record<string, string>> = { en, it, es, fr, de, pt };

export const availableLocales = ['en', 'it', 'es', 'fr', 'de', 'pt'];

function detectLocale(): string {
    const langs = navigator.languages ?? [navigator.language];
    for (const lang of langs) {
        const code = lang.split('-')[0].toLowerCase();
        if (availableLocales.includes(code)) return code;
    }
    return 'en';
}

export const currentLocale = ref(
    localStorage.getItem('locale') ?? detectLocale(),
);

export function trans(key: string): string {
    return messages[currentLocale.value]?.[key] ?? messages['en']?.[key] ?? key;
}

export function setLocale(locale: string) {
    if (availableLocales.includes(locale)) {
        currentLocale.value = locale;
        localStorage.setItem('locale', locale);
        document.documentElement.lang = locale;
    }
}

export const i18nPlugin: Plugin = {
    install(app) {
        app.config.globalProperties.$t = trans;
    },
};
