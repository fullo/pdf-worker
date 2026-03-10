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

import { extractImages } from '@/Services/pdf/extractImages';

describe('extractImages', () => {
    // Our simple test PDFs have no embedded raster images,
    // so the service correctly throws "No images found".
    it('throws when PDF contains no images', async () => {
        const file = await createSimplePdf(2);
        await expect(extractImages(file)).rejects.toThrow('No images found');
    });

    it('reports progress before erroring', async () => {
        const file = await createSimplePdf(1);
        const values: number[] = [];
        await expect(
            extractImages(file, (p) => values.push(p)),
        ).rejects.toThrow();
        expect(values.length).toBeGreaterThan(0);
    });
});
