import { describe, it, expect } from 'vitest';
import { editPdf } from '@/Services/pdf/editPdf';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('editPdf', () => {
    it('adds a text element', async () => {
        const file = await createSimplePdf(1);
        const result = await editPdf(file, [
            { type: 'text', pageIndex: 0, x: 100, y: 500, text: 'Hello World' },
        ]);
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'edit pdf');
    });

    it('adds a rectangle element', async () => {
        const file = await createSimplePdf(1);
        const result = await editPdf(file, [
            { type: 'rectangle', pageIndex: 0, x: 50, y: 400, width: 200, height: 100 },
        ]);
        await expectValidPdf(result, 1);
    });

    it('adds a border-only rectangle', async () => {
        const file = await createSimplePdf(1);
        const result = await editPdf(file, [
            {
                type: 'rectangle',
                pageIndex: 0,
                x: 50,
                y: 400,
                width: 200,
                height: 100,
                borderOnly: true,
            },
        ]);
        await expectValidPdf(result, 1);
    });

    it('adds a line element', async () => {
        const file = await createSimplePdf(1);
        const result = await editPdf(file, [
            { type: 'line', pageIndex: 0, startX: 50, startY: 500, endX: 300, endY: 300 },
        ]);
        await expectValidPdf(result, 1);
    });

    it('adds a freehand element', async () => {
        const file = await createSimplePdf(1);
        const result = await editPdf(file, [
            {
                type: 'freehand',
                pageIndex: 0,
                points: [
                    { x: 50, y: 500 },
                    { x: 100, y: 450 },
                    { x: 150, y: 480 },
                ],
            },
        ]);
        await expectValidPdf(result, 1);
    });

    it('adds multiple elements across pages', async () => {
        const file = await createSimplePdf(2);
        const result = await editPdf(file, [
            { type: 'text', pageIndex: 0, x: 50, y: 500, text: 'Page 1' },
            { type: 'rectangle', pageIndex: 1, x: 50, y: 400, width: 100, height: 50 },
        ]);
        await expectValidPdf(result, 2);
    });

    it('supports text styling options', async () => {
        const file = await createSimplePdf(1);
        const result = await editPdf(file, [
            {
                type: 'text',
                pageIndex: 0,
                x: 50,
                y: 500,
                text: 'Styled text',
                fontSize: 24,
                color: { r: 1, g: 0, b: 0 },
                bold: true,
                italic: true,
            },
        ]);
        await expectValidPdf(result, 1);
    });

    it('throws on empty elements array', async () => {
        const file = await createSimplePdf(1);
        await expect(editPdf(file, [])).rejects.toThrow('No elements provided');
    });

    it('throws on out-of-bounds page index', async () => {
        const file = await createSimplePdf(1);
        await expect(
            editPdf(file, [{ type: 'text', pageIndex: 5, x: 50, y: 500, text: 'Oops' }]),
        ).rejects.toThrow('out of bounds');
    });
});
