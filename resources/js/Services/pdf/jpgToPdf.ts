import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

export interface JpgToPdfOptions {
    orientation: 'portrait' | 'landscape';
    margin: 'none' | 'small' | 'large';
}

/**
 * Margin sizes in points (1 point = 1/72 inch).
 */
const MARGIN_MAP: Record<JpgToPdfOptions['margin'], number> = {
    none: 0,
    small: 36,  // 0.5 inch
    large: 72,  // 1 inch
};

/**
 * Load an image file into an HTMLImageElement to read its natural dimensions.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = url;
    });
}

/**
 * Embed an image file into a PDFDocument.
 * Supports JPEG and PNG formats.
 */
async function embedImage(pdfDoc: PDFDocument, file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const mimeType = file.type.toLowerCase();

    if (mimeType === 'image/png') {
        return pdfDoc.embedPng(bytes);
    }

    // Default to JPEG for jpg, jpeg, and any other image type
    return pdfDoc.embedJpg(bytes);
}

/**
 * Convert one or more image files into a single PDF document.
 *
 * Each image becomes one page. The page size is determined by the image's
 * aspect ratio combined with the chosen orientation and margin settings.
 *
 * @param files      - Array of image Files (JPEG or PNG).
 * @param options    - Conversion options (orientation, margin).
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the resulting PDF.
 */
export async function jpgToPdf(
    files: File[],
    options: JpgToPdfOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (files.length === 0) {
        throw new Error('No image files provided');
    }

    const pdfDoc = await PDFDocument.create();
    const margin = MARGIN_MAP[options.margin];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Load the image to get its dimensions
        const img = await loadImage(file);
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const imgAspectRatio = imgWidth / imgHeight;

        // Embed the image into the PDF
        const embeddedImage = await embedImage(pdfDoc, file);

        // Determine page dimensions based on orientation and image aspect ratio.
        // We use A4-like base dimensions (595.28 x 841.89 points) but adjust
        // to match the image's aspect ratio so the image fills the available area.
        let pageWidth: number;
        let pageHeight: number;

        const availableWidth = (options.orientation === 'portrait' ? 595.28 : 841.89) - margin * 2;
        const availableHeight = (options.orientation === 'portrait' ? 841.89 : 595.28) - margin * 2;

        // Scale image to fit within the available area while preserving aspect ratio
        let drawWidth: number;
        let drawHeight: number;

        if (imgAspectRatio > availableWidth / availableHeight) {
            // Image is wider relative to the available space
            drawWidth = availableWidth;
            drawHeight = availableWidth / imgAspectRatio;
        } else {
            // Image is taller relative to the available space
            drawHeight = availableHeight;
            drawWidth = availableHeight * imgAspectRatio;
        }

        pageWidth = drawWidth + margin * 2;
        pageHeight = drawHeight + margin * 2;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Center the image on the page
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
        });

        onProgress?.(Math.round(((i + 1) / files.length) * 100));
    }

    stampDefaultMetadata(pdfDoc, 'jpg to pdf');
    return savePdfAsBlob(pdfDoc);
}
