import { describe, it, expect, vi } from 'vitest';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';

vi.mock('@/Services/pdfUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/Services/pdfUtils')>();
    const { MockCanvas } = await import('@/__tests__/helpers/canvasMock');
    return {
        ...actual,
        createCanvas: (w: number, h: number) => new MockCanvas(w, h),
        // Note: removeBlankPages does NOT use canvasToBlob, only createCanvas + getImageData
    };
});

import { removeBlankPages } from '@/Services/pdf/removeBlankPages';

describe('removeBlankPages', () => {
    // Mock getImageData returns gray pixels (128), which is below WHITE_THRESHOLD (250),
    // so all pages appear to have content → "No blank pages found" error.
    it('throws when no blank pages are found', async () => {
        const file = await createSimplePdf(3);
        await expect(removeBlankPages(file)).rejects.toThrow('No blank pages found');
    });

    it('reports progress before erroring', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await expect(
            removeBlankPages(file, (p) => values.push(p)),
        ).rejects.toThrow();
        // Progress should have been reported during page scanning
        expect(values.length).toBeGreaterThan(0);
    });
});
