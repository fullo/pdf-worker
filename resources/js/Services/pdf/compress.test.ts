import { describe, it, expect, vi } from 'vitest';
import { createSimplePdf, createBloatedPdf } from '@/__tests__/helpers/fixtures';
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
    // --- Successful compression via render path ---

    it('medium level compresses a bloated PDF', async () => {
        const file = await createBloatedPdf(3);
        const result = await compressPdf(file, 'medium');
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'compress pdf');
        expect(result.size).toBeLessThan(file.size);
    });

    it('high level compresses a bloated PDF', async () => {
        const file = await createBloatedPdf(3);
        const result = await compressPdf(file, 'high');
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'compress pdf');
        expect(result.size).toBeLessThan(file.size);
    });

    // --- Rejects already-optimised PDFs ---

    it('throws for small PDF that cannot be compressed further', async () => {
        const file = await createSimplePdf(1);
        await expect(compressPdf(file, 'medium')).rejects.toThrow(
            'already well optimised',
        );
    });

    it('low level throws for already-optimised PDF', async () => {
        // pdf-lib re-serialisation rarely shrinks files it generated itself
        const file = await createSimplePdf(1);
        await expect(compressPdf(file, 'low')).rejects.toThrow(
            'already well optimised',
        );
    });

    // --- Progress reporting ---

    it('reports progress for medium level', async () => {
        const file = await createBloatedPdf(2);
        const values: number[] = [];
        await compressPdf(file, 'medium', (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });

    it('reports progress even when compression fails', async () => {
        const file = await createSimplePdf(1);
        const values: number[] = [];
        try {
            await compressPdf(file, 'low', (p) => values.push(p));
        } catch {
            // Expected: "already well optimised"
        }
        // lightCompress reports progress before the size check
        expect(values.length).toBeGreaterThan(0);
    });
});
