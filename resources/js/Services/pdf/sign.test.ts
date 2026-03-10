import { describe, it, expect } from 'vitest';
import { signPdf } from '@/Services/pdf/sign';
import { createSimplePdf, createMinimalPng } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

/** Create a minimal PNG data URL for draw-type signatures. */
function createPngDataUrl(): string {
    const pngBytes = createMinimalPng();
    const base64 = Buffer.from(pngBytes).toString('base64');
    return `data:image/png;base64,${base64}`;
}

describe('signPdf', () => {
    it('adds a drawn signature', async () => {
        const file = await createSimplePdf(1);
        const result = await signPdf(file, {
            type: 'draw',
            pageIndex: 0,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            drawDataUrl: createPngDataUrl(),
        });
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'sign pdf');
    });

    it('adds an image signature from File', async () => {
        const file = await createSimplePdf(1);
        const pngBytes = createMinimalPng();
        const imageFile = new File([pngBytes], 'signature.png', { type: 'image/png' });

        const result = await signPdf(file, {
            type: 'image',
            pageIndex: 0,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            imageFile,
        });
        await expectValidPdf(result, 1);
    });

    it('throws on out-of-bounds page index', async () => {
        const file = await createSimplePdf(1);
        await expect(
            signPdf(file, {
                type: 'draw',
                pageIndex: 5,
                x: 100,
                y: 100,
                width: 150,
                height: 50,
                drawDataUrl: createPngDataUrl(),
            }),
        ).rejects.toThrow('out of bounds');
    });

    it('throws when drawDataUrl is missing for draw type', async () => {
        const file = await createSimplePdf(1);
        await expect(
            signPdf(file, {
                type: 'draw',
                pageIndex: 0,
                x: 100,
                y: 100,
                width: 150,
                height: 50,
            }),
        ).rejects.toThrow('drawDataUrl is required');
    });

    it('throws when imageFile is missing for image type', async () => {
        const file = await createSimplePdf(1);
        await expect(
            signPdf(file, {
                type: 'image',
                pageIndex: 0,
                x: 100,
                y: 100,
                width: 150,
                height: 50,
            }),
        ).rejects.toThrow('imageFile is required');
    });

    it('throws on unknown signature type', async () => {
        const file = await createSimplePdf(1);
        await expect(
            signPdf(file, {
                type: 'invalid' as any,
                pageIndex: 0,
                x: 100,
                y: 100,
                width: 150,
                height: 50,
            }),
        ).rejects.toThrow('Unknown signature type');
    });
});
