import { describe, it, expect } from 'vitest';
import { addWatermark } from '@/Services/pdf/watermark';
import { createSimplePdf, createMinimalPng } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('addWatermark', () => {
    describe('text watermark', () => {
        it('adds a text watermark to all pages', async () => {
            const file = await createSimplePdf(3);
            const result = await addWatermark(file, {
                type: 'text',
                text: 'CONFIDENTIAL',
                opacity: 0.5,
                xPercent: 0.5,
                yPercent: 0.5,
            });
            const doc = await expectValidPdf(result, 3);
            expectDefaultMetadata(doc, 'watermark pdf');
        });

        it('accepts custom font size and color', async () => {
            const file = await createSimplePdf(1);
            const result = await addWatermark(file, {
                type: 'text',
                text: 'DRAFT',
                fontSize: 72,
                color: { r: 1, g: 0, b: 0 },
                rotation: 45,
                opacity: 0.3,
                xPercent: 0.5,
                yPercent: 0.5,
            });
            await expectValidPdf(result, 1);
        });

        it('throws on empty text', async () => {
            const file = await createSimplePdf(1);
            await expect(
                addWatermark(file, {
                    type: 'text',
                    text: '   ',
                    opacity: 0.5,
                    xPercent: 0.5,
                    yPercent: 0.5,
                }),
            ).rejects.toThrow('empty');
        });
    });

    describe('image watermark', () => {
        it('adds a PNG image watermark', async () => {
            const file = await createSimplePdf(1);
            const result = await addWatermark(file, {
                type: 'image',
                imageBytes: createMinimalPng(),
                imageMimeType: 'image/png',
                opacity: 0.5,
                xPercent: 0.5,
                yPercent: 0.5,
            });
            await expectValidPdf(result, 1);
        });

        it('throws when imageBytes is missing', async () => {
            const file = await createSimplePdf(1);
            await expect(
                addWatermark(file, {
                    type: 'image',
                    opacity: 0.5,
                    xPercent: 0.5,
                    yPercent: 0.5,
                }),
            ).rejects.toThrow('Image bytes and MIME type are required');
        });

        it('throws on unsupported image type', async () => {
            const file = await createSimplePdf(1);
            await expect(
                addWatermark(file, {
                    type: 'image',
                    imageBytes: createMinimalPng(),
                    imageMimeType: 'image/bmp',
                    opacity: 0.5,
                    xPercent: 0.5,
                    yPercent: 0.5,
                }),
            ).rejects.toThrow('Unsupported image type');
        });
    });

    it('throws on unknown watermark type', async () => {
        const file = await createSimplePdf(1);
        await expect(
            addWatermark(file, {
                type: 'invalid' as any,
                opacity: 0.5,
                xPercent: 0.5,
                yPercent: 0.5,
            }),
        ).rejects.toThrow('Unknown watermark type');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const progressValues: number[] = [];
        await addWatermark(
            file,
            { type: 'text', text: 'TEST', opacity: 0.5, xPercent: 0.5, yPercent: 0.5 },
            (p) => progressValues.push(p),
        );
        expect(progressValues).toHaveLength(3);
        expect(progressValues[2]).toBe(100);
    });
});
