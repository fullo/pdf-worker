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

import { grayscalePdf } from '@/Services/pdf/grayscale';

describe('grayscalePdf', () => {
    it('produces a valid PDF with same page count', async () => {
        const file = await createSimplePdf(3);
        const result = await grayscalePdf(file);
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'grayscale pdf');
    });

    it('handles single-page PDF', async () => {
        const file = await createSimplePdf(1);
        const result = await grayscalePdf(file);
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const values: number[] = [];
        await grayscalePdf(file, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
