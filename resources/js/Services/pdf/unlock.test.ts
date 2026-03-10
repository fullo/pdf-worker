import { describe, it, expect } from 'vitest';
import { unlockPdf } from '@/Services/pdf/unlock';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('unlockPdf', () => {
    it('unlocks a PDF given a password', async () => {
        const file = await createSimplePdf(2);
        // Even without real encryption, the service should process and return a valid PDF
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
});
