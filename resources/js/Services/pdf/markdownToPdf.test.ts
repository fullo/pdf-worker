import { describe, it, expect } from 'vitest';
import { markdownToPdf } from '@/Services/pdf/markdownToPdf';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('markdownToPdf', () => {
    it('creates a PDF from a simple heading', async () => {
        const result = await markdownToPdf('# Hello World');
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'markdown to pdf');
    });

    it('handles multiple heading levels', async () => {
        const md = '# H1\n\n## H2\n\n### H3\n\nParagraph text.';
        const result = await markdownToPdf(md);
        await expectValidPdf(result, 1);
    });

    it('handles bullet lists', async () => {
        const md = '# List\n\n- Item 1\n- Item 2\n- Item 3';
        const result = await markdownToPdf(md);
        await expectValidPdf(result, 1);
    });

    it('handles numbered lists', async () => {
        const md = '# Steps\n\n1. First\n2. Second\n3. Third';
        const result = await markdownToPdf(md);
        await expectValidPdf(result, 1);
    });

    it('handles code blocks', async () => {
        const md = '# Code\n\n```\nconst x = 1;\nconsole.log(x);\n```';
        const result = await markdownToPdf(md);
        await expectValidPdf(result, 1);
    });

    it('handles bold and italic inline formatting', async () => {
        const md = 'This has **bold** and *italic* text.';
        const result = await markdownToPdf(md);
        await expectValidPdf(result, 1);
    });

    it('handles horizontal rules', async () => {
        const md = 'Above\n\n---\n\nBelow';
        const result = await markdownToPdf(md);
        await expectValidPdf(result, 1);
    });

    it('creates multiple pages for long content', async () => {
        const sections = Array(30)
            .fill(0)
            .map((_, i) => `## Section ${i + 1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`)
            .join('\n\n');
        const result = await markdownToPdf(sections);
        const doc = await expectValidPdf(result);
        expect(doc.getPageCount()).toBeGreaterThan(1);
    });

    it('throws on empty markdown', async () => {
        await expect(markdownToPdf('   ')).rejects.toThrow('empty');
    });

    it('reports progress', async () => {
        const progressValues: number[] = [];
        await markdownToPdf('# Test\n\nContent', (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
