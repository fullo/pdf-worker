import { rgb, StandardFonts } from 'pdf-lib';
import { loadPdf, savePdfAsBlob } from '../pdfUtils';

export interface HeaderFooterOptions {
    header?: {
        text: string;
        align: 'left' | 'center' | 'right';
    };
    footer?: {
        text: string;
        align: 'left' | 'center' | 'right';
    };
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    margin?: number; // distance from edge in points
}

const DEFAULT_FONT_SIZE = 10;
const DEFAULT_COLOR = { r: 0, g: 0, b: 0 };
const DEFAULT_MARGIN = 30;
const HORIZONTAL_PADDING = 40;

/**
 * Replace {page} and {total} placeholders in a text string with actual values.
 */
function replacePlaceholders(text: string, pageNumber: number, totalPages: number): string {
    return text
        .replace(/\{page\}/g, String(pageNumber))
        .replace(/\{total\}/g, String(totalPages));
}

/**
 * Calculate the X position for text based on alignment.
 */
function calculateXPosition(
    align: 'left' | 'center' | 'right',
    pageWidth: number,
    textWidth: number
): number {
    switch (align) {
        case 'left':
            return HORIZONTAL_PADDING;
        case 'center':
            return (pageWidth - textWidth) / 2;
        case 'right':
            return pageWidth - textWidth - HORIZONTAL_PADDING;
    }
}

/**
 * Add custom header and/or footer text to all pages of a PDF.
 *
 * Supports {page} and {total} placeholders in text that get replaced
 * with the current page number and total page count respectively.
 *
 * @param file       - The source PDF File.
 * @param options    - Header/footer configuration options.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the PDF with headers and/or footers.
 */
export async function addHeaderFooter(
    file: File,
    options: HeaderFooterOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (!options.header && !options.footer) {
        throw new Error('At least one of header or footer must be provided');
    }

    const pdfDoc = await loadPdf(file);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
    const color = options.color ?? DEFAULT_COLOR;
    const margin = options.margin ?? DEFAULT_MARGIN;
    const pdfColor = rgb(color.r, color.g, color.b);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNumber = i + 1;

        // Draw header
        if (options.header && options.header.text) {
            const headerText = replacePlaceholders(options.header.text, pageNumber, totalPages);
            const textWidth = font.widthOfTextAtSize(headerText, fontSize);
            const x = calculateXPosition(options.header.align, width, textWidth);
            const y = height - margin;

            page.drawText(headerText, {
                x,
                y,
                size: fontSize,
                font,
                color: pdfColor,
            });
        }

        // Draw footer
        if (options.footer && options.footer.text) {
            const footerText = replacePlaceholders(options.footer.text, pageNumber, totalPages);
            const textWidth = font.widthOfTextAtSize(footerText, fontSize);
            const x = calculateXPosition(options.footer.align, width, textWidth);
            const y = margin;

            page.drawText(footerText, {
                x,
                y,
                size: fontSize,
                font,
                color: pdfColor,
            });
        }

        onProgress?.(Math.round(((i + 1) / pages.length) * 100));
    }

    return savePdfAsBlob(pdfDoc);
}
