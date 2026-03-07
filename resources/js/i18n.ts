import { ref, type Plugin } from 'vue';

import en from '../../lang/en.json';
import it from '../../lang/it.json';
import es from '../../lang/es.json';
import fr from '../../lang/fr.json';
import de from '../../lang/de.json';
import pt from '../../lang/pt.json';
import nl from '../../lang/nl.json';
import sv from '../../lang/sv.json';
import fi from '../../lang/fi.json';
import da from '../../lang/da.json';
import no from '../../lang/no.json';
import be from '../../lang/be.json';
import el from '../../lang/el.json';
import sl from '../../lang/sl.json';
import cs from '../../lang/cs.json';

const messages: Record<string, Record<string, string>> = { en, it, es, fr, de, pt, nl, sv, fi, da, no, be, el, sl, cs };

export const availableLocales = ['en', 'it', 'es', 'fr', 'de', 'pt', 'nl', 'sv', 'fi', 'da', 'no', 'be', 'el', 'sl', 'cs'];

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
