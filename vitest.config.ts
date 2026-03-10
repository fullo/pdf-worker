import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs',
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['resources/js/**/*.test.ts'],
        setupFiles: ['resources/js/__tests__/setup.ts'],
        testTimeout: 15_000,
        pool: 'forks',
        coverage: {
            provider: 'v8',
            include: ['resources/js/Services/**/*.ts'],
            exclude: ['resources/js/Services/profiler/**'],
        },
    },
});
