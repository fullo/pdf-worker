import { describe, it, expect, vi } from 'vitest';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

vi.mock('@/Services/pdfUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/Services/pdfUtils')>();
    const { MockCanvas, mockCanvasToBlob } = await import('@/__tests__/helpers/canvasMock');
    return {
        ...actual,
        createCanvas: (w: number, h: number) => new MockCanvas(w, h),
        canvasToBlob: mockCanvasToBlob,
    };
});

import { nupPdf } from '@/Services/pdf/nup';

describe('nupPdf', () => {
    it('creates 2-up layout', async () => {
        const file = await createSimplePdf(4);
        const result = await nupPdf(file, 2);
        const doc = await expectValidPdf(result);
        expectDefaultMetadata(doc, 'n-up pdf');
        // 4 pages → 2 sheets (2 per sheet)
        expect(doc.getPageCount()).toBe(2);
    });

    it('creates 4-up layout', async () => {
        const file = await createSimplePdf(4);
        const result = await nupPdf(file, 4);
        const doc = await expectValidPdf(result);
        // 4 pages → 1 sheet (4 per sheet)
        expect(doc.getPageCount()).toBe(1);
    });

    it('creates 9-up layout', async () => {
        const file = await createSimplePdf(9);
        const result = await nupPdf(file, 9);
        const doc = await expectValidPdf(result);
        // 9 pages → 1 sheet (9 per sheet)
        expect(doc.getPageCount()).toBe(1);
    });

    it('handles partial last sheet', async () => {
        const file = await createSimplePdf(5);
        const result = await nupPdf(file, 4);
        const doc = await expectValidPdf(result);
        // 5 pages → 2 sheets (4+1)
        expect(doc.getPageCount()).toBe(2);
    });

    it('handles 3 pages with 4-up (empty cell filled)', async () => {
        const file = await createSimplePdf(3);
        const result = await nupPdf(file, 4);
        const doc = await expectValidPdf(result);
        // 3 pages → 1 sheet with 1 empty cell
        expect(doc.getPageCount()).toBe(1);
    });

    it('handles 3 pages with 9-up (6 empty cells filled)', async () => {
        const file = await createSimplePdf(3);
        const result = await nupPdf(file, 9);
        const doc = await expectValidPdf(result);
        // 3 pages → 1 sheet with 6 empty cells
        expect(doc.getPageCount()).toBe(1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(4);
        const values: number[] = [];
        await nupPdf(file, 2, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
    });
});
