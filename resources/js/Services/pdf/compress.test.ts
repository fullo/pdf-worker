import { describe, it, expect, vi, beforeAll } from 'vitest';
import sharp from 'sharp';
import { createSimplePdf, createPdfWithEmbeddedImage } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

// --- Global mocks for OffscreenCanvas + createImageBitmap ---
// The new compress code uses these directly (works in browser/worker, not Node).

let _mockJpegBlob: Blob | null = null;
async function getMockJpegBlob(): Promise<Blob> {
    if (_mockJpegBlob) return _mockJpegBlob;
    const buf = await sharp({
        create: { width: 1, height: 1, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg({ quality: 1 }).toBuffer();
    _mockJpegBlob = new Blob([buf as BlobPart], { type: 'image/jpeg' });
    return _mockJpegBlob;
}

class MockOffscreenCanvas {
    width: number;
    height: number;
    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }
    getContext() {
        return {
            drawImage() {},
            putImageData() {},
        };
    }
    async convertToBlob(_opts?: any): Promise<Blob> {
        return getMockJpegBlob();
    }
}

beforeAll(() => {
    // Polyfill OffscreenCanvas
    if (typeof globalThis.OffscreenCanvas === 'undefined') {
        (globalThis as any).OffscreenCanvas = MockOffscreenCanvas;
    }

    // Polyfill createImageBitmap
    if (typeof globalThis.createImageBitmap === 'undefined') {
        (globalThis as any).createImageBitmap = async (_source: any) => ({
            width: 200,
            height: 200,
            close() {},
        });
    }

    // Polyfill ImageData if needed
    if (typeof globalThis.ImageData === 'undefined') {
        (globalThis as any).ImageData = class ImageData {
            data: Uint8ClampedArray;
            width: number;
            height: number;
            constructor(data: Uint8ClampedArray, width: number, height?: number) {
                this.data = data;
                this.width = width;
                this.height = height ?? (data.length / (width * 4));
            }
        };
    }
});

// Mock pdfjs-dist text extraction for verifyTextPreserved
vi.mock('pdfjs-dist', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return actual;
});

import { compressPdf, verifyTextPreserved } from '@/Services/pdf/compress';

describe('compressPdf', () => {
    // --- Image-based compression (medium/high) ---

    it('medium level compresses a PDF with embedded images', async () => {
        const file = await createPdfWithEmbeddedImage(2, 300, 300);
        const result = await compressPdf(file, 'medium');
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'compress pdf');
        expect(result.size).toBeLessThan(file.size);
    });

    it('high level compresses a PDF with embedded images', async () => {
        const file = await createPdfWithEmbeddedImage(2, 300, 300);
        const result = await compressPdf(file, 'high');
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'compress pdf');
        expect(result.size).toBeLessThan(file.size);
    });

    // --- Fallback to lightCompress for text-only PDFs ---

    it('throws for small text-only PDF that cannot be compressed', async () => {
        const file = await createSimplePdf(1);
        await expect(compressPdf(file, 'medium')).rejects.toThrow(
            'already well optimised',
        );
    });

    it('low level throws for already-optimised PDF', async () => {
        const file = await createSimplePdf(1);
        await expect(compressPdf(file, 'low')).rejects.toThrow(
            'already well optimised',
        );
    });

    // --- Progress reporting ---

    it('reports progress for medium level', async () => {
        const file = await createPdfWithEmbeddedImage(2, 300, 300);
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
        expect(values.length).toBeGreaterThan(0);
    });
});

describe('verifyTextPreserved', () => {
    it('returns true for identical PDFs', async () => {
        const file = await createSimplePdf(2);
        const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
        const result = await verifyTextPreserved(file, blob);
        expect(result).toBe(true);
    });
});
