import { createRouter, createWebHashHistory } from 'vue-router';

const Home = () => import('@/Pages/Home.vue');
const Tool = () => import('@/Pages/Tool.vue');
const Privacy = () => import('@/Pages/Privacy.vue');

const router = createRouter({
    history: createWebHashHistory(),
    scrollBehavior() { return { top: 0 }; },
    routes: [
        { path: '/', name: 'home', component: Home },
        { path: '/privacy', name: 'privacy', component: Privacy },
        { path: '/:tool', name: 'tool', component: Tool, props: true },
    ],
});

export default router;
