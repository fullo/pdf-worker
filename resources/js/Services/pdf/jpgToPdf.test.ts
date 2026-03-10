import { describe, it, expect, vi, beforeAll } from 'vitest';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';
import sharp from 'sharp';

// Polyfill browser APIs that jpgToPdf needs (URL.createObjectURL, Image)
beforeAll(() => {
    if (typeof globalThis.URL.createObjectURL === 'undefined') {
        (globalThis.URL as any).createObjectURL = (_blob: Blob) => 'blob:mock-url';
    }
    if (typeof globalThis.URL.revokeObjectURL === 'undefined') {
        (globalThis.URL as any).revokeObjectURL = () => {};
    }
    if (typeof globalThis.Image === 'undefined') {
        (globalThis as any).Image = class MockImage {
            naturalWidth = 100;
            naturalHeight = 100;
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            set src(_url: string) {
                // Fire onload asynchronously
                setTimeout(() => this.onload?.(), 0);
            }
        };
    }
});

import { jpgToPdf } from '@/Services/pdf/jpgToPdf';

async function createJpegFile(name = 'photo.jpg'): Promise<File> {
    const buf = await sharp({
        create: { width: 200, height: 300, channels: 3, background: { r: 100, g: 150, b: 200 } },
    }).jpeg({ quality: 50 }).toBuffer();
    return new File([buf], name, { type: 'image/jpeg' });
}

async function createPngFile(name = 'image.png'): Promise<File> {
    const buf = await sharp({
        create: { width: 150, height: 150, channels: 4, background: { r: 200, g: 100, b: 50, alpha: 1 } },
    }).png().toBuffer();
    return new File([buf], name, { type: 'image/png' });
}

describe('jpgToPdf', () => {
    it('converts a single JPEG to a valid PDF', async () => {
        const file = await createJpegFile();
        const result = await jpgToPdf([file], { orientation: 'portrait', margin: 'none' });
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'jpg to pdf');
    });

    it('converts multiple images to multi-page PDF', async () => {
        const files = [await createJpegFile('a.jpg'), await createJpegFile('b.jpg'), await createPngFile('c.png')];
        const result = await jpgToPdf(files, { orientation: 'portrait', margin: 'small' });
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'jpg to pdf');
    });

    it('throws on empty files array', async () => {
        await expect(
            jpgToPdf([], { orientation: 'portrait', margin: 'none' }),
        ).rejects.toThrow('No image files provided');
    });

    it('supports landscape orientation', async () => {
        const file = await createJpegFile();
        const result = await jpgToPdf([file], { orientation: 'landscape', margin: 'large' });
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const files = [await createJpegFile('a.jpg'), await createJpegFile('b.jpg')];
        const values: number[] = [];
        await jpgToPdf(files, { orientation: 'portrait', margin: 'none' }, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
