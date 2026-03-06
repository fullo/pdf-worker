import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,woff2,mjs}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.bunny\.net\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'bunny-fonts',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                        },
                    },
                ],
            },
            manifest: {
                name: 'PDF Worker - Free Online PDF Tools',
                short_name: 'PDF Worker',
                description: 'Free online PDF tools that run entirely in your browser. Your files never leave your device.',
                theme_color: '#1e3a5f',
                background_color: '#f9fafb',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    base: '/',
    build: {
        outDir: 'docs',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'pdf-lib': ['pdf-lib'],
                    'pdfjs': ['pdfjs-dist'],
                    'vendor': ['jszip', 'file-saver'],
                },
            },
        },
    },
});
