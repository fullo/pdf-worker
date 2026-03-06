import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    base: './',
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
