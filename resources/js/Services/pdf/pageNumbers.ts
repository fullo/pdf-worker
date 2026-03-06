import { rgb, StandardFonts } from 'pdf-lib';
import { loadPdf, savePdfAsBlob } from '../pdfUtils';

export interface PageNumberOptions {
    position: 'bottom-center' | 'bottom-right' | 'bottom-left';
    format: 'number' | 'page-of-total'; // "1" or "1 / 10"
    fontSize?: number;
    startNumber?: number;
}

const DEFAULT_FONT_SIZE = 12;
const DEFAULT_START_NUMBER = 1;
const MARGIN_BOTTOM = 30;
const MARGIN_HORIZONTAL = 40;

/**
 * Add page numbers to all pages of a PDF.
 *
 * @param file       - The source PDF File.
 * @param options    - Page number configuration options.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the PDF with page numbers.
 */
export async function addPageNumbers(
    file: File,
    options: PageNumberOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const pdfDoc = await loadPdf(file);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
    const startNumber = options.startNumber ?? DEFAULT_START_NUMBER;
    const color = rgb(0, 0, 0);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width } = page.getSize();
        const currentNumber = startNumber + i;

        // Build the page number text
        let text: string;
        if (options.format === 'page-of-total') {
            const displayTotal = startNumber + totalPages - 1;
            text = `${currentNumber} / ${displayTotal}`;
        } else {
            text = `${currentNumber}`;
        }

        const textWidth = font.widthOfTextAtSize(text, fontSize);

        // Calculate X position based on the position option
        let x: number;
        switch (options.position) {
            case 'bottom-center':
                x = (width - textWidth) / 2;
                break;
            case 'bottom-right':
                x = width - textWidth - MARGIN_HORIZONTAL;
                break;
            case 'bottom-left':
                x = MARGIN_HORIZONTAL;
                break;
        }

        page.drawText(text, {
            x,
            y: MARGIN_BOTTOM,
            size: fontSize,
            font,
            color,
        });

        onProgress?.(Math.round(((i + 1) / pages.length) * 100));
    }

    return savePdfAsBlob(pdfDoc);
}
