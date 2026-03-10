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

import { compressPdf } from '@/Services/pdf/compress';

describe('compressPdf', () => {
    it('low level produces valid PDF (pdf-lib path)', async () => {
        const file = await createSimplePdf(2);
        const result = await compressPdf(file, 'low');
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'compress pdf');
    });

    it('medium level produces valid PDF (render path)', async () => {
        const file = await createSimplePdf(2);
        const result = await compressPdf(file, 'medium');
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'compress pdf');
    });

    it('high level produces valid PDF (render path)', async () => {
        const file = await createSimplePdf(1);
        const result = await compressPdf(file, 'high');
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'compress pdf');
    });

    it('reports progress for low level', async () => {
        const file = await createSimplePdf(1);
        const values: number[] = [];
        await compressPdf(file, 'low', (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });

    it('reports progress for medium level', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await compressPdf(file, 'medium', (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
