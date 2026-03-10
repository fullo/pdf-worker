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

// Mock tesseract.js — avoid downloading real language models
vi.mock('tesseract.js', () => ({
    createWorker: async () => ({
        recognize: async () => ({
            data: {
                text: 'Mock OCR text',
                words: [
                    {
                        text: 'Mock',
                        bbox: { x0: 10, y0: 10, x1: 60, y1: 30 },
                    },
                    {
                        text: 'OCR',
                        bbox: { x0: 70, y0: 10, x1: 110, y1: 30 },
                    },
                ],
            },
        }),
        terminate: async () => {},
    }),
}));

import { ocrPdf } from '@/Services/pdf/ocrPdf';

describe('ocrPdf', () => {
    it('produces a valid PDF with same page count', async () => {
        const file = await createSimplePdf(2);
        const result = await ocrPdf(file);
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'ocr pdf');
    });

    it('handles single page', async () => {
        const file = await createSimplePdf(1);
        const result = await ocrPdf(file, 'eng');
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await ocrPdf(file, 'eng', (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
