import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '@/Pages/Home.vue';
import Tool from '@/Pages/Tool.vue';
import Privacy from '@/Pages/Privacy.vue';

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
