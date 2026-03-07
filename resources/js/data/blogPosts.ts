export interface BlogPost {
    slug: string;
    lang: 'en' | 'it' | 'de' | 'fr' | 'pt' | 'es';
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

export const blogPosts: BlogPost[] = [
    ...blogPostsEn,
    ...blogPostsIt,
    ...blogPostsDe,
    ...blogPostsFr,
    ...blogPostsPt,
    ...blogPostsEs,
];
