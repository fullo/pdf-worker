import { loadPdf, savePdfAsBlob, stampDefaultMetadata, MAX_IMAGE_DIMENSION } from '../pdfUtils';

export interface SignatureOptions {
    type: 'draw' | 'image';
    pageIndex: number; // 0-based page to sign
    x: number;
    y: number;
    width: number;
    height: number;
    // For 'draw' type: a PNG data URL from canvas
    drawDataUrl?: string;
    // For 'image' type: an image File (PNG/JPG)
    imageFile?: File;
}

/**
 * Decode a base64 data URL into a Uint8Array.
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
        throw new Error('Invalid data URL: missing base64 content');
    }
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Add a signature (drawn or image-based) to a specific page of a PDF.
 *
 * For 'draw' type: the drawDataUrl should be a PNG data URL (e.g. from a
 * canvas element). The image is decoded and embedded as a PNG.
 *
 * For 'image' type: the imageFile should be a PNG or JPG File. It is read
 * as an ArrayBuffer and embedded using the appropriate format.
 *
 * @param file       - The source PDF File.
 * @param options    - Signature placement and source options.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the signed PDF.
 */
export async function signPdf(
    file: File,
    options: SignatureOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();

    if (options.pageIndex < 0 || options.pageIndex >= pages.length) {
        throw new Error(
            `Page index ${options.pageIndex} is out of bounds. The PDF has ${pages.length} pages (0-based).`
        );
    }

    onProgress?.(20);

    const page = pages[options.pageIndex];
    let embeddedImage;

    if (options.type === 'draw') {
        if (!options.drawDataUrl) {
            throw new Error('drawDataUrl is required for "draw" signature type');
        }

        const pngBytes = dataUrlToUint8Array(options.drawDataUrl);
        embeddedImage = await pdfDoc.embedPng(pngBytes);
    } else if (options.type === 'image') {
        if (!options.imageFile) {
            throw new Error('imageFile is required for "image" signature type');
        }

        const arrayBuffer = await options.imageFile.arrayBuffer();
        const imageBytes = new Uint8Array(arrayBuffer);
        const mimeType = options.imageFile.type.toLowerCase();

        if (mimeType === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
            // Default to JPEG for jpg, jpeg, and other image types
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
    } else {
        throw new Error(`Unknown signature type: ${options.type}`);
    }

    if (embeddedImage.width > MAX_IMAGE_DIMENSION || embeddedImage.height > MAX_IMAGE_DIMENSION) {
        throw new Error(`Signature image is too large (${embeddedImage.width}x${embeddedImage.height}px, max ${MAX_IMAGE_DIMENSION}px per side)`);
    }

    onProgress?.(60);

    page.drawImage(embeddedImage, {
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
    });

    onProgress?.(80);

    stampDefaultMetadata(pdfDoc, 'sign pdf');
    const blob = await savePdfAsBlob(pdfDoc);
    onProgress?.(100);

    return blob;
}
