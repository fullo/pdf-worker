import { describe, it, expect } from 'vitest';
import { editMetadata } from '@/Services/pdf/editMetadata';
import { createPdfWithMetadata } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, parsePdfBlob } from '@/__tests__/helpers/assertions';

describe('editMetadata', () => {
    it('sets title, author, and subject', async () => {
        const file = await createPdfWithMetadata({});
        const result = await editMetadata(file, {
            title: 'New Title',
            author: 'Test Author',
            subject: 'Test Subject',
        });
        const doc = await expectValidPdf(result, 1);
        expect(doc.getTitle()).toBe('New Title');
        expect(doc.getAuthor()).toBe('Test Author');
        expect(doc.getSubject()).toBe('Test Subject');
    });

    it('overrides existing metadata', async () => {
        const file = await createPdfWithMetadata({
            title: 'Old Title',
            author: 'Old Author',
        });
        const result = await editMetadata(file, {
            title: 'Updated Title',
        });
        const doc = await parsePdfBlob(result);
        expect(doc.getTitle()).toBe('Updated Title');
    });

    it('sets keywords', async () => {
        const file = await createPdfWithMetadata({});
        const result = await editMetadata(file, {
            keywords: ['pdf', 'test', 'vitest'],
        });
        const doc = await parsePdfBlob(result);
        const keywords = doc.getKeywords();
        expect(keywords).toContain('pdf');
        expect(keywords).toContain('test');
        expect(keywords).toContain('vitest');
    });

    it('preserves page count', async () => {
        const file = await createPdfWithMetadata({ title: 'Test' });
        const result = await editMetadata(file, { title: 'Updated' });
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createPdfWithMetadata({});
        const progressValues: number[] = [];
        await editMetadata(file, { title: 'Test' }, (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
        expect(progressValues[progressValues.length - 1]).toBe(100);
    });
});
