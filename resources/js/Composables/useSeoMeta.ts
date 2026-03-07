const BASE_URL = 'https://www.pdfworker.eu';

export function useSeoMeta(
    title: string,
    description: string,
    canonicalPath?: string,
    jsonLd?: Record<string, unknown> | null,
) {
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    // Update canonical URL
    const fullUrl = canonicalPath ? `${BASE_URL}${canonicalPath}` : BASE_URL;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;
    setMeta('property', 'og:url', fullUrl);

    // Inject/replace dynamic JSON-LD
    const jsonLdId = 'dynamic-jsonld';
    let scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (jsonLd) {
        if (!scriptEl) {
            scriptEl = document.createElement('script');
            scriptEl.id = jsonLdId;
            scriptEl.type = 'application/ld+json';
            document.head.appendChild(scriptEl);
        }
        scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
        scriptEl.remove();
    }
}
