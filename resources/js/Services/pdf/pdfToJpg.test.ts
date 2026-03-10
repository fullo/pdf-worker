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

import { pdfToJpg } from '@/Services/pdf/pdfToJpg';

describe('pdfToJpg', () => {
    it('returns one result per page', async () => {
        const file = await createSimplePdf(3);
        const results = await pdfToJpg(file, { quality: 0.8 });
        expect(results).toHaveLength(3);
    });

    it('generates correct file names', async () => {
        const file = new File([await (await createSimplePdf(2)).arrayBuffer()], 'my-doc.pdf', { type: 'application/pdf' });
        const results = await pdfToJpg(file, { quality: 0.8 });
        expect(results[0].name).toBe('my-doc_page_1.jpg');
        expect(results[1].name).toBe('my-doc_page_2.jpg');
    });

    it('returns non-empty blobs', async () => {
        const file = await createSimplePdf(1);
        const results = await pdfToJpg(file, { quality: 0.8 });
        expect(results[0].blob.size).toBeGreaterThan(0);
    });

    it('clamps quality to valid range', async () => {
        const file = await createSimplePdf(1);
        // quality below 0.1 should be clamped
        const results = await pdfToJpg(file, { quality: -1 });
        expect(results).toHaveLength(1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const values: number[] = [];
        await pdfToJpg(file, { quality: 0.8 }, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
