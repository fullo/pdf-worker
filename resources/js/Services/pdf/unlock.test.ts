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

import { unlockPdf } from '@/Services/pdf/unlock';

describe('unlockPdf', () => {
    it('processes a non-encrypted PDF (pass-through)', async () => {
        const file = await createSimplePdf(2);
        // A non-encrypted PDF should be openable with any password
        const result = await unlockPdf(file, 'anypassword');
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'unlock pdf');
    });

    it('throws when password is empty', async () => {
        const file = await createSimplePdf(1);
        await expect(unlockPdf(file, '')).rejects.toThrow('Password is required');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(1);
        const progressValues: number[] = [];
        await unlockPdf(file, 'pass', (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
        expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('output is a valid PDF blob', async () => {
        const file = await createSimplePdf(3);
        const result = await unlockPdf(file, 'test');
        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('application/pdf');
        expect(result.size).toBeGreaterThan(0);
    });
});
