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

import { invertColors } from '@/Services/pdf/invertColors';

describe('invertColors', () => {
    it('produces a valid PDF with same page count', async () => {
        const file = await createSimplePdf(3);
        const result = await invertColors(file);
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'invert colors');
    });

    it('handles single-page PDF', async () => {
        const file = await createSimplePdf(1);
        const result = await invertColors(file);
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await invertColors(file, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
