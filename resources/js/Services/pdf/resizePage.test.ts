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

import { resizePages } from '@/Services/pdf/resizePage';

describe('resizePages', () => {
    it('resizes to A4', async () => {
        const file = await createSimplePdf(2);
        const result = await resizePages(file, 'a4');
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'resize pdf');
    });

    it('resizes to letter', async () => {
        const file = await createSimplePdf(1);
        const result = await resizePages(file, 'letter');
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'resize pdf');
    });

    it('resizes to A3', async () => {
        const file = await createSimplePdf(1);
        const result = await resizePages(file, 'a3');
        await expectValidPdf(result, 1);
    });

    it('resizes to legal', async () => {
        const file = await createSimplePdf(1);
        const result = await resizePages(file, 'legal');
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await resizePages(file, 'a4', (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
