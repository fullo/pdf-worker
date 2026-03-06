import { ref, type Plugin } from 'vue';

import en from '../../lang/en.json';
import it from '../../lang/it.json';
import es from '../../lang/es.json';
import fr from '../../lang/fr.json';
import de from '../../lang/de.json';
import pt from '../../lang/pt.json';

const messages: Record<string, Record<string, string>> = { en, it, es, fr, de, pt };

export const availableLocales = ['en', 'it', 'es', 'fr', 'de', 'pt'];

export const currentLocale = ref(
    localStorage.getItem('locale') ?? (navigator.language.startsWith('it') ? 'it' : 'en'),
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
