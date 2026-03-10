import { describe, it, expect } from 'vitest';
import { rotatePdf } from '@/Services/pdf/rotate';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, parsePdfBlob, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('rotatePdf', () => {
    it('rotates all pages by 90 degrees', async () => {
        const file = await createSimplePdf(3);
        const result = await rotatePdf(file, 90);
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'rotate pdf');

        for (const page of doc.getPages()) {
            expect(page.getRotation().angle).toBe(90);
        }
    });

    it('rotates all pages by 180 degrees', async () => {
        const file = await createSimplePdf(2);
        const result = await rotatePdf(file, 180);
        const doc = await parsePdfBlob(result);
        for (const page of doc.getPages()) {
            expect(page.getRotation().angle).toBe(180);
        }
    });

    it('rotates all pages by 270 degrees', async () => {
        const file = await createSimplePdf(1);
        const result = await rotatePdf(file, 270);
        const doc = await parsePdfBlob(result);
        expect(doc.getPage(0).getRotation().angle).toBe(270);
    });

    it('rotates only specific pages', async () => {
        const file = await createSimplePdf(4);
        const result = await rotatePdf(file, 90, [0, 2]);
        const doc = await parsePdfBlob(result);
        expect(doc.getPage(0).getRotation().angle).toBe(90);
        expect(doc.getPage(1).getRotation().angle).toBe(0);
        expect(doc.getPage(2).getRotation().angle).toBe(90);
        expect(doc.getPage(3).getRotation().angle).toBe(0);
    });

    it('throws on out-of-bounds page index', async () => {
        const file = await createSimplePdf(2);
        await expect(rotatePdf(file, 90, [5])).rejects.toThrow('out of bounds');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const progressValues: number[] = [];
        await rotatePdf(file, 90, undefined, (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
        expect(progressValues[progressValues.length - 1]).toBe(100);
    });
});
