import { describe, it, expect, vi } from 'vitest';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';

vi.mock('@/Services/pdfUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/Services/pdfUtils')>();
    const { MockCanvas, mockCanvasToBlob } = await import('@/__tests__/helpers/canvasMock');
    return {
        ...actual,
        createCanvas: (w: number, h: number) => new MockCanvas(w, h),
        canvasToBlob: mockCanvasToBlob,
    };
});

import { pdfToWebp } from '@/Services/pdf/pdfToWebp';

describe('pdfToWebp', () => {
    it('returns one result per page', async () => {
        const file = await createSimplePdf(3);
        const results = await pdfToWebp(file, { quality: 0.8 });
        expect(results).toHaveLength(3);
    });

    it('returns non-empty blobs', async () => {
        const file = await createSimplePdf(1);
        const results = await pdfToWebp(file, { quality: 0.8 });
        expect(results[0].blob.size).toBeGreaterThan(0);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await pdfToWebp(file, { quality: 0.8 }, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
