import { rgb, StandardFonts, type PDFDocument, type PDFFont } from 'pdf-lib';
import { loadPdf, savePdfAsBlob } from '../pdfUtils';

export type EditElement =
    | {
          type: 'text';
          pageIndex: number;
          x: number;
          y: number;
          text: string;
          fontSize?: number;
          color?: { r: number; g: number; b: number };
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          strikethrough?: boolean;
          backgroundColor?: { r: number; g: number; b: number };
      }
    | {
          type: 'rectangle';
          pageIndex: number;
          x: number;
          y: number;
          width: number;
          height: number;
          color?: { r: number; g: number; b: number };
          borderOnly?: boolean;
      }
    | {
          type: 'line';
          pageIndex: number;
          startX: number;
          startY: number;
          endX: number;
          endY: number;
          color?: { r: number; g: number; b: number };
          thickness?: number;
      }
    | {
          type: 'freehand';
          pageIndex: number;
          points: { x: number; y: number }[];
          color?: { r: number; g: number; b: number };
          thickness?: number;
      };

const DEFAULT_COLOR = { r: 0, g: 0, b: 0 };
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_THICKNESS = 1;

function getHelveticaVariant(bold?: boolean, italic?: boolean): StandardFonts {
    if (bold && italic) return StandardFonts.HelveticaBoldOblique;
    if (bold) return StandardFonts.HelveticaBold;
    if (italic) return StandardFonts.HelveticaOblique;
    return StandardFonts.Helvetica;
}

/**
 * Add text annotations, rectangles, lines, and freehand drawings to PDF pages.
 *
 * @param file       - The source PDF File.
 * @param elements   - Array of elements to draw on the PDF.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the edited PDF.
 */
export async function editPdf(
    file: File,
    elements: EditElement[],
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (elements.length === 0) {
        throw new Error('No elements provided for editing');
    }

    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();

    // Lazy font cache to avoid re-embedding the same variant
    const fontCache = new Map<StandardFonts, PDFFont>();
    async function getFont(variant: StandardFonts): Promise<PDFFont> {
        let font = fontCache.get(variant);
        if (!font) {
            font = await pdfDoc.embedFont(variant);
            fontCache.set(variant, font);
        }
        return font;
    }

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        if (element.pageIndex < 0 || element.pageIndex >= pages.length) {
            throw new Error(
                `Page index ${element.pageIndex} is out of bounds. The PDF has ${pages.length} pages (0-based).`
            );
        }

        const page = pages[element.pageIndex];
        const color = element.color ?? DEFAULT_COLOR;
        const pdfColor = rgb(color.r, color.g, color.b);

        switch (element.type) {
            case 'text': {
                const fontSize = element.fontSize ?? DEFAULT_FONT_SIZE;
                const variant = getHelveticaVariant(element.bold, element.italic);
                const font = await getFont(variant);

                // Draw background rectangle if set
                if (element.backgroundColor) {
                    const textWidth = font.widthOfTextAtSize(element.text, fontSize);
                    const textHeight = font.heightAtSize(fontSize);
                    const padding = fontSize * 0.1;
                    page.drawRectangle({
                        x: element.x - padding,
                        y: element.y - padding,
                        width: textWidth + 2 * padding,
                        height: textHeight + 2 * padding,
                        color: rgb(
                            element.backgroundColor.r,
                            element.backgroundColor.g,
                            element.backgroundColor.b,
                        ),
                    });
                }

                // Draw the text
                page.drawText(element.text, {
                    x: element.x,
                    y: element.y,
                    size: fontSize,
                    font,
                    color: pdfColor,
                });

                // Draw underline
                if (element.underline) {
                    const textWidth = font.widthOfTextAtSize(element.text, fontSize);
                    const lineThickness = Math.max(0.5, fontSize * 0.05);
                    const underlineY = element.y - fontSize * 0.15;
                    page.drawLine({
                        start: { x: element.x, y: underlineY },
                        end: { x: element.x + textWidth, y: underlineY },
                        thickness: lineThickness,
                        color: pdfColor,
                    });
                }

                // Draw strikethrough
                if (element.strikethrough) {
                    const textWidth = font.widthOfTextAtSize(element.text, fontSize);
                    const lineThickness = Math.max(0.5, fontSize * 0.05);
                    const strikeY = element.y + fontSize * 0.3;
                    page.drawLine({
                        start: { x: element.x, y: strikeY },
                        end: { x: element.x + textWidth, y: strikeY },
                        thickness: lineThickness,
                        color: pdfColor,
                    });
                }

                break;
            }

            case 'rectangle': {
                if (element.borderOnly) {
                    page.drawRectangle({
                        x: element.x,
                        y: element.y,
                        width: element.width,
                        height: element.height,
                        borderColor: pdfColor,
                        borderWidth: 1,
                        opacity: 0,
                    });
                } else {
                    page.drawRectangle({
                        x: element.x,
                        y: element.y,
                        width: element.width,
                        height: element.height,
                        color: pdfColor,
                    });
                }
                break;
            }

            case 'line': {
                const thickness = element.thickness ?? DEFAULT_LINE_THICKNESS;
                page.drawLine({
                    start: { x: element.startX, y: element.startY },
                    end: { x: element.endX, y: element.endY },
                    thickness,
                    color: pdfColor,
                });
                break;
            }

            case 'freehand': {
                const thickness = element.thickness ?? DEFAULT_LINE_THICKNESS;
                const points = element.points;

                if (points.length < 2) {
                    break; // Need at least 2 points to draw a line
                }

                for (let j = 0; j < points.length - 1; j++) {
                    page.drawLine({
                        start: { x: points[j].x, y: points[j].y },
                        end: { x: points[j + 1].x, y: points[j + 1].y },
                        thickness,
                        color: pdfColor,
                    });
                }
                break;
            }
        }

        onProgress?.(Math.round(((i + 1) / elements.length) * 100));
    }

    return savePdfAsBlob(pdfDoc);
}
