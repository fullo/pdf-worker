import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '@/Pages/Home.vue';

const Tool = () => import('@/Pages/Tool.vue');
const Privacy = () => import('@/Pages/Privacy.vue');
const Blog = () => import('@/Pages/Blog.vue');
const BlogPost = () => import('@/Pages/BlogPost.vue');
const SciReport = () => import('@/Pages/SciReport.vue');

const router = createRouter({
    history: createWebHashHistory(),
    scrollBehavior() { return { top: 0 }; },
    routes: [
        { path: '/', name: 'home', component: Home },
        { path: '/privacy', name: 'privacy', component: Privacy },
        { path: '/blog', name: 'blog', component: Blog },
        { path: '/blog/:slug', name: 'blog-post', component: BlogPost, props: true },
        { path: '/sci-report', name: 'sci-report', component: SciReport },
        { path: '/:tool', name: 'tool', component: Tool, props: true },
    ],
});

export default router;
