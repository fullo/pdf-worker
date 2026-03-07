import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob } from '../pdfUtils';

export interface MetadataOptions {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
}

/**
 * Update the metadata fields of a PDF document.
 *
 * @param file       - The source PDF File.
 * @param options    - Metadata key-value pairs to set.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the PDF with updated metadata.
 */
export async function editMetadata(
    file: File,
    options: MetadataOptions,
    onProgress?: (progress: number) => void,
): Promise<Blob> {
    onProgress?.(10);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    onProgress?.(40);

    if (options.title !== undefined) pdfDoc.setTitle(options.title);
    if (options.author !== undefined) pdfDoc.setAuthor(options.author);
    if (options.subject !== undefined) pdfDoc.setSubject(options.subject);
    if (options.keywords !== undefined) pdfDoc.setKeywords(options.keywords);
    if (options.creator !== undefined) pdfDoc.setCreator(options.creator);
    if (options.producer !== undefined) pdfDoc.setProducer(options.producer);

    onProgress?.(70);

    const blob = await savePdfAsBlob(pdfDoc);

    onProgress?.(100);

    return blob;
}
