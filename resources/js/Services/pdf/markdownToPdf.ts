import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

/**
 * Convert Markdown text to a styled PDF document.
 *
 * Supports: headings (# to ###), bold (**text**), italic (*text*),
 * bullet lists (- item), numbered lists (1. item), code blocks (```),
 * horizontal rules (---), and paragraphs.
 */
export async function markdownToPdf(
    markdown: string,
    onProgress?: (progress: number) => void,
): Promise<Blob> {
    if (!markdown.trim()) {
        throw new Error('Markdown content is empty');
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const PAGE_WIDTH = 595.28; // A4
    const PAGE_HEIGHT = 841.89;
    const MARGIN = 50;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
    const LINE_HEIGHT_FACTOR = 1.4;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    function ensureSpace(needed: number): void {
        if (y - needed < MARGIN) {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
        }
    }

    /**
     * Word-wrap text to fit within maxWidth, returning an array of lines.
     */
    function wrapText(text: string, f: PDFFont, size: number, maxWidth: number): string[] {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = f.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines.length ? lines : [''];
    }

    /**
     * Draw wrapped text, advancing y. Returns the y after drawing.
     */
    function drawWrapped(
        text: string,
        f: PDFFont,
        size: number,
        color = rgb(0, 0, 0),
        indent = 0,
    ): void {
        const maxW = CONTENT_WIDTH - indent;
        const lines = wrapText(text, f, size, maxW);
        const lineH = size * LINE_HEIGHT_FACTOR;

        for (const line of lines) {
            ensureSpace(lineH);
            page.drawText(line, { x: MARGIN + indent, y: y - size, size, font: f, color });
            y -= lineH;
        }
    }

    // Parse markdown into blocks
    const lines = markdown.split('\n');
    const blocks: { type: string; content: string; level?: number }[] = [];
    let inCodeBlock = false;
    let codeContent = '';

    for (const raw of lines) {
        if (raw.startsWith('```')) {
            if (inCodeBlock) {
                blocks.push({ type: 'code', content: codeContent.trimEnd() });
                codeContent = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent += raw + '\n';
            continue;
        }

        const trimmed = raw.trim();

        if (trimmed === '') {
            blocks.push({ type: 'blank', content: '' });
        } else if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
            blocks.push({ type: 'hr', content: '' });
        } else if (trimmed.startsWith('### ')) {
            blocks.push({ type: 'heading', content: trimmed.slice(4), level: 3 });
        } else if (trimmed.startsWith('## ')) {
            blocks.push({ type: 'heading', content: trimmed.slice(3), level: 2 });
        } else if (trimmed.startsWith('# ')) {
            blocks.push({ type: 'heading', content: trimmed.slice(2), level: 1 });
        } else if (/^[-*]\s/.test(trimmed)) {
            blocks.push({ type: 'bullet', content: trimmed.slice(2) });
        } else if (/^\d+\.\s/.test(trimmed)) {
            blocks.push({ type: 'numbered', content: trimmed.replace(/^\d+\.\s/, '') });
        } else {
            blocks.push({ type: 'paragraph', content: trimmed });
        }
    }
    if (inCodeBlock && codeContent) {
        blocks.push({ type: 'code', content: codeContent.trimEnd() });
    }

    const total = blocks.length;
    let numberedCounter = 0;

    for (let i = 0; i < total; i++) {
        const block = blocks[i];

        switch (block.type) {
            case 'heading': {
                const sizes: Record<number, number> = { 1: 24, 2: 20, 3: 16 };
                const size = sizes[block.level ?? 1] ?? 16;
                const spaceBefore = block.level === 1 ? 20 : 14;
                ensureSpace(size * LINE_HEIGHT_FACTOR + spaceBefore);
                y -= spaceBefore;
                drawWrapped(stripInlineFormatting(block.content), fontBold, size);
                y -= 4;
                break;
            }
            case 'paragraph': {
                const segments = parseInline(block.content);
                drawInlineSegments(segments, 12, 0);
                y -= 6;
                break;
            }
            case 'bullet': {
                numberedCounter = 0;
                ensureSpace(12 * LINE_HEIGHT_FACTOR);
                page.drawText('\u2022', { x: MARGIN + 8, y: y - 12, size: 12, font, color: rgb(0, 0, 0) });
                const segments = parseInline(block.content);
                drawInlineSegments(segments, 12, 22);
                y -= 2;
                break;
            }
            case 'numbered': {
                numberedCounter++;
                ensureSpace(12 * LINE_HEIGHT_FACTOR);
                const label = `${numberedCounter}.`;
                page.drawText(label, { x: MARGIN + 4, y: y - 12, size: 12, font, color: rgb(0, 0, 0) });
                const segments = parseInline(block.content);
                drawInlineSegments(segments, 12, 22);
                y -= 2;
                break;
            }
            case 'code': {
                const codeLines = block.content.split('\n');
                const codeSize = 10;
                const lineH = codeSize * LINE_HEIGHT_FACTOR;
                const blockH = codeLines.length * lineH + 16;
                ensureSpace(Math.min(blockH, PAGE_HEIGHT - MARGIN * 2));
                // Background
                const bgTop = y;
                y -= 8;
                for (const cl of codeLines) {
                    ensureSpace(lineH);
                    page.drawText(cl, {
                        x: MARGIN + 12,
                        y: y - codeSize,
                        size: codeSize,
                        font: fontMono,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                    y -= lineH;
                }
                y -= 8;
                // Draw background rect from bgTop to current y
                const bgHeight = bgTop - y;
                page.drawRectangle({
                    x: MARGIN,
                    y,
                    width: CONTENT_WIDTH,
                    height: bgHeight,
                    color: rgb(0.95, 0.95, 0.95),
                    opacity: 1,
                });
                // Re-draw code on top of background
                let cy = bgTop - 8;
                for (const cl of codeLines) {
                    page.drawText(cl, {
                        x: MARGIN + 12,
                        y: cy - codeSize,
                        size: codeSize,
                        font: fontMono,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                    cy -= lineH;
                }
                y -= 6;
                break;
            }
            case 'hr': {
                ensureSpace(20);
                y -= 10;
                page.drawLine({
                    start: { x: MARGIN, y },
                    end: { x: PAGE_WIDTH - MARGIN, y },
                    thickness: 0.5,
                    color: rgb(0.7, 0.7, 0.7),
                });
                y -= 10;
                break;
            }
            case 'blank': {
                y -= 8;
                if (blocks[i - 1]?.type !== 'bullet' && blocks[i - 1]?.type !== 'numbered') {
                    numberedCounter = 0;
                }
                break;
            }
        }

        onProgress?.(Math.round(((i + 1) / total) * 100));
    }

    stampDefaultMetadata(pdfDoc, 'markdown to pdf');
    return savePdfAsBlob(pdfDoc);

    // ---- Inline formatting helpers ----

    interface InlineSegment {
        text: string;
        bold: boolean;
        italic: boolean;
        mono: boolean;
    }

    function stripInlineFormatting(text: string): string {
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`(.+?)`/g, '$1');
    }

    function parseInline(text: string): InlineSegment[] {
        const segments: InlineSegment[] = [];
        // Simple regex-based parser for **bold**, *italic*, `code`
        const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|([^*`]+))/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            if (match[2]) {
                segments.push({ text: match[2], bold: true, italic: false, mono: false });
            } else if (match[3]) {
                segments.push({ text: match[3], bold: false, italic: true, mono: false });
            } else if (match[4]) {
                segments.push({ text: match[4], bold: false, italic: false, mono: true });
            } else if (match[5]) {
                segments.push({ text: match[5], bold: false, italic: false, mono: false });
            }
        }
        return segments.length ? segments : [{ text, bold: false, italic: false, mono: false }];
    }

    function drawInlineSegments(segments: InlineSegment[], size: number, indent: number): void {
        // Flatten segments into a single string for simple wrapping, then draw
        // (Full inline-aware wrapping is complex; we simplify by concatenating)
        const fullText = segments.map(s => s.text).join('');
        const maxW = CONTENT_WIDTH - indent;
        const wrappedLines = wrapText(fullText, font, size, maxW);
        const lineH = size * LINE_HEIGHT_FACTOR;

        // For each wrapped line, try to apply segment formatting
        let segIdx = 0;
        let segOff = 0;

        for (const line of wrappedLines) {
            ensureSpace(lineH);
            let x = MARGIN + indent;
            let remaining = line.length;
            let linePos = 0;

            while (remaining > 0 && segIdx < segments.length) {
                const seg = segments[segIdx];
                const segRemaining = seg.text.length - segOff;
                const take = Math.min(remaining, segRemaining);
                const chunk = seg.text.slice(segOff, segOff + take);

                const f = seg.mono ? fontMono : seg.bold ? fontBold : seg.italic ? fontItalic : font;
                const color = seg.mono ? rgb(0.3, 0.3, 0.3) : rgb(0, 0, 0);

                if (chunk.trim()) {
                    page.drawText(chunk, { x, y: y - size, size, font: f, color });
                }
                x += font.widthOfTextAtSize(chunk, size);

                segOff += take;
                linePos += take;
                remaining -= take;

                if (segOff >= seg.text.length) {
                    segIdx++;
                    segOff = 0;
                }
            }

            // Account for spaces between words that bridge segments
            if (remaining > 0) {
                linePos += remaining;
            }

            y -= lineH;
        }
    }
}
