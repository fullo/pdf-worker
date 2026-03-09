import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

/**
 * Convert plain text to a formatted PDF document.
 */
export async function textToPdf(
    text: string,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    onProgress?.(10);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);

    const fontSize = 11;
    const margin = 50;
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const lineHeight = fontSize * 1.4;
    const maxWidth = pageWidth - margin * 2;

    // Split text into lines, then wrap long lines
    const rawLines = text.split('\n');
    const wrappedLines: string[] = [];

    for (const line of rawLines) {
        if (line.length === 0) {
            wrappedLines.push('');
            continue;
        }
        // Word-wrap
        const words = line.split(' ');
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            if (width > maxWidth && currentLine) {
                wrappedLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) wrappedLines.push(currentLine);
    }

    onProgress?.(30);

    const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
    const totalPages = Math.ceil(wrappedLines.length / linesPerPage);

    for (let p = 0; p < totalPages; p++) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const startLine = p * linesPerPage;
        const endLine = Math.min(startLine + linesPerPage, wrappedLines.length);

        for (let i = startLine; i < endLine; i++) {
            const y = pageHeight - margin - (i - startLine) * lineHeight;
            page.drawText(wrappedLines[i], {
                x: margin,
                y,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });
        }

        onProgress?.(30 + Math.round(((p + 1) / totalPages) * 60));
    }

    stampDefaultMetadata(pdfDoc, 'text to pdf');
    return savePdfAsBlob(pdfDoc);
}
