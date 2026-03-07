export interface BlogPost {
    slug: string;
    lang: 'en' | 'it' | 'de' | 'fr' | 'pt' | 'es' | 'nl' | 'sv' | 'fi' | 'da' | 'no' | 'be' | 'el' | 'sl' | 'cs';
    title: string;
    excerpt: string;
    body: string;
    date: string;
    tool: string;
    tags: string[];
}

/**
 * Lazy loaders for blog posts, keyed by language code.
 * Each language file is only fetched when requested (code-split).
 */
const loaders: Record<string, () => Promise<BlogPost[]>> = {
    en: () => import('./blog/en').then(m => m.blogPostsEn),
    it: () => import('./blog/it').then(m => m.blogPostsIt),
    de: () => import('./blog/de').then(m => m.blogPostsDe),
    fr: () => import('./blog/fr').then(m => m.blogPostsFr),
    pt: () => import('./blog/pt').then(m => m.blogPostsPt),
    es: () => import('./blog/es').then(m => m.blogPostsEs),
    nl: () => import('./blog/nl').then(m => m.blogPostsNl),
    sv: () => import('./blog/sv').then(m => m.blogPostsSv),
    fi: () => import('./blog/fi').then(m => m.blogPostsFi),
    da: () => import('./blog/da').then(m => m.blogPostsDa),
    no: () => import('./blog/no').then(m => m.blogPostsNo),
    be: () => import('./blog/be').then(m => m.blogPostsBe),
    el: () => import('./blog/el').then(m => m.blogPostsEl),
    sl: () => import('./blog/sl').then(m => m.blogPostsSl),
    cs: () => import('./blog/cs').then(m => m.blogPostsCs),
};

/** Cache to avoid re-importing the same language file. */
const cache = new Map<string, BlogPost[]>();

/**
 * Load blog posts for a specific language.
 * Returns cached data on subsequent calls.
 */
export async function getPostsByLang(lang: string): Promise<BlogPost[]> {
    if (cache.has(lang)) return cache.get(lang)!;
    const loader = loaders[lang] || loaders['en'];
    const posts = await loader();
    cache.set(lang, posts);
    return posts;
}

/**
 * Find a single blog post by slug.
 * Tries the preferred language first, then falls back to all others.
 */
export async function findPostBySlug(
    slug: string,
    preferredLang: string,
): Promise<{ post: BlogPost; allPosts: BlogPost[] } | null> {
    // Try preferred language first
    const preferred = await getPostsByLang(preferredLang);
    const found = preferred.find(p => p.slug === slug);
    if (found) return { post: found, allPosts: preferred };

    // Fall back: try every other language
    for (const lang of Object.keys(loaders)) {
        if (lang === preferredLang) continue;
        const posts = await getPostsByLang(lang);
        const post = posts.find(p => p.slug === slug);
        if (post) return { post, allPosts: posts };
    }

    return null;
}
