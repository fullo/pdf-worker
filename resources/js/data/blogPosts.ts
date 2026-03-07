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

import { blogPostsEn } from './blog/en';
import { blogPostsIt } from './blog/it';
import { blogPostsDe } from './blog/de';
import { blogPostsFr } from './blog/fr';
import { blogPostsPt } from './blog/pt';
import { blogPostsEs } from './blog/es';
import { blogPostsNl } from './blog/nl';
import { blogPostsSv } from './blog/sv';
import { blogPostsFi } from './blog/fi';
import { blogPostsDa } from './blog/da';
import { blogPostsNo } from './blog/no';
import { blogPostsBe } from './blog/be';
import { blogPostsEl } from './blog/el';
import { blogPostsSl } from './blog/sl';
import { blogPostsCs } from './blog/cs';

export const blogPosts: BlogPost[] = [
    ...blogPostsEn,
    ...blogPostsIt,
    ...blogPostsDe,
    ...blogPostsFr,
    ...blogPostsPt,
    ...blogPostsEs,
    ...blogPostsNl,
    ...blogPostsSv,
    ...blogPostsFi,
    ...blogPostsDa,
    ...blogPostsNo,
    ...blogPostsBe,
    ...blogPostsEl,
    ...blogPostsSl,
    ...blogPostsCs,
];
