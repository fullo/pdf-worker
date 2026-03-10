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

import { comparePdf } from '@/Services/pdf/comparePdf';

describe('comparePdf', () => {
    it('produces a valid comparison PDF from two files', async () => {
        const file1 = await createSimplePdf(2);
        const file2 = await createSimplePdf(2);
        const result = await comparePdf(file1, file2);
        const doc = await expectValidPdf(result);
        expectDefaultMetadata(doc, 'compare pdf');
        // Comparison renders max(pages) combined pages
        expect(doc.getPageCount()).toBe(2);
    });

    it('handles PDFs with different page counts', async () => {
        const file1 = await createSimplePdf(1);
        const file2 = await createSimplePdf(3);
        const result = await comparePdf(file1, file2);
        const doc = await expectValidPdf(result);
        expect(doc.getPageCount()).toBe(3);
    });

    it('reports progress', async () => {
        const file1 = await createSimplePdf(2);
        const file2 = await createSimplePdf(2);
        const values: number[] = [];
        await comparePdf(file1, file2, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
    });
});
