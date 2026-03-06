import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '@/Pages/Home.vue';
import Tool from '@/Pages/Tool.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', name: 'home', component: Home },
        { path: '/:tool', name: 'tool', component: Tool, props: true },
    ],
});

export default router;
