import { PDFDocument, rgb, degrees, StandardFonts, PDFPage } from 'pdf-lib';
import { loadPdf, savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

export interface WatermarkOptions {
    type: 'text' | 'image';
    // For text watermarks
    text?: string;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    rotation?: number; // degrees
    // For image watermarks
    imageBytes?: Uint8Array;
    imageMimeType?: string; // 'image/png' or 'image/jpeg'
    // Common options
    opacity: number; // 0-1
    // Position as percentage of page (0-1 range), so it scales across different page sizes
    xPercent: number; // 0 = left edge, 1 = right edge
    yPercent: number; // 0 = bottom edge, 1 = top edge
    // Size
    width?: number;  // in points for image, ignored for text
    height?: number; // in points for image, ignored for text
}

const DEFAULT_FONT_SIZE = 48;
const DEFAULT_COLOR = { r: 0.5, g: 0.5, b: 0.5 };
const DEFAULT_ROTATION = 0;

/**
 * Draw a text watermark on a single PDF page.
 */
function drawTextWatermarkOnPage(
    page: PDFPage,
    text: string,
    font: any,
    fontSize: number,
    color: { r: number; g: number; b: number },
    opacity: number,
    rotation: number,
    xPercent: number,
    yPercent: number
): void {
    const { width, height } = page.getSize();

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // Calculate position from percentage, centering the text on the point
    const x = xPercent * width - textWidth / 2;
    const y = yPercent * height - textHeight / 2;

    page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(rotation),
    });
}

/**
 * Draw an image watermark on a single PDF page.
 */
function drawImageWatermarkOnPage(
    page: PDFPage,
    image: any, // PDFImage from pdf-lib
    opacity: number,
    xPercent: number,
    yPercent: number,
    drawWidth: number,
    drawHeight: number
): void {
    const { width, height } = page.getSize();

    // Calculate position from percentage, centering the image on the point
    const x = xPercent * width - drawWidth / 2;
    const y = yPercent * height - drawHeight / 2;

    page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
        opacity,
    });
}

/**
 * Add a watermark (text or image) to all pages of a PDF.
 *
 * @param file       - The source PDF File.
 * @param options    - Watermark configuration options.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the watermarked PDF.
 */
export async function addWatermark(
    file: File,
    options: WatermarkOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();

    if (options.type === 'text') {
        const text = options.text?.trim();
        if (!text || text.length === 0) {
            throw new Error('Watermark text cannot be empty');
        }

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
        const color = options.color ?? DEFAULT_COLOR;
        const rotation = options.rotation ?? DEFAULT_ROTATION;

        for (let i = 0; i < pages.length; i++) {
            drawTextWatermarkOnPage(
                pages[i],
                text,
                font,
                fontSize,
                color,
                options.opacity,
                rotation,
                options.xPercent,
                options.yPercent
            );
            onProgress?.(Math.round(((i + 1) / pages.length) * 100));
        }
    } else if (options.type === 'image') {
        if (!options.imageBytes || !options.imageMimeType) {
            throw new Error('Image bytes and MIME type are required for image watermarks');
        }

        let image;
        if (options.imageMimeType === 'image/png') {
            image = await pdfDoc.embedPng(options.imageBytes);
        } else if (options.imageMimeType === 'image/jpeg' || options.imageMimeType === 'image/jpg') {
            image = await pdfDoc.embedJpg(options.imageBytes);
        } else {
            throw new Error(`Unsupported image type: ${options.imageMimeType}. Use PNG or JPEG.`);
        }

        // Use provided dimensions or fall back to the image's native size
        const drawWidth = options.width ?? image.width;
        const drawHeight = options.height ?? image.height;

        for (let i = 0; i < pages.length; i++) {
            drawImageWatermarkOnPage(
                pages[i],
                image,
                options.opacity,
                options.xPercent,
                options.yPercent,
                drawWidth,
                drawHeight
            );
            onProgress?.(Math.round(((i + 1) / pages.length) * 100));
        }
    } else {
        throw new Error(`Unknown watermark type: ${(options as any).type}`);
    }

    stampDefaultMetadata(pdfDoc, 'watermark pdf');
    return savePdfAsBlob(pdfDoc);
}
