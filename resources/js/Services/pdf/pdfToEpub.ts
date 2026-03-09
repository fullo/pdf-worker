import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { MAX_PDF_PAGES } from '../pdfUtils';

/**
 * Convert a PDF to EPUB format.
 *
 * Extracts text from each page and packages it into a valid EPUB 3 file.
 * EPUB is essentially a ZIP containing XHTML, CSS, and metadata files.
 */
export async function pdfToEpub(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    const title = file.name.replace(/\.pdf$/i, '');
    const pages: string[] = [];

    // Extract text from each page
    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        let lastY: number | null = null;
        let pageText = '';

        for (const item of textContent.items) {
            if (!('str' in item)) continue;
            const textItem = item as { str: string; transform: number[] };
            const y = textItem.transform[5];

            if (lastY !== null && Math.abs(y - lastY) > 2) {
                pageText += '\n';
            } else if (lastY !== null && pageText.length > 0 && !pageText.endsWith('\n')) {
                pageText += ' ';
            }

            pageText += textItem.str;
            lastY = y;
        }

        pages.push(pageText.trim());
        page.cleanup();
        onProgress?.(Math.round((i / pageCount) * 70));
    }

    if (pages.every(p => p.length === 0)) {
        throw new Error('No text content found in PDF. Scanned documents require OCR first.');
    }

    // Build EPUB using JSZip
    const zip = new JSZip();

    // mimetype must be first and uncompressed
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // Container XML
    zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    // Stylesheet
    zip.file('OEBPS/style.css', `body {
  font-family: serif;
  margin: 1em;
  line-height: 1.6;
}
h1 { font-size: 1.5em; margin-bottom: 0.5em; }
h2 { font-size: 1.2em; margin: 1em 0 0.5em; color: #333; }
p { margin: 0.5em 0; text-indent: 0; }
.page-break { page-break-after: always; }
`);

    // Escape XML special characters
    const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Generate chapter XHTML files
    const chapterFiles: string[] = [];
    for (let i = 0; i < pages.length; i++) {
        const chapterName = `chapter_${i + 1}.xhtml`;
        chapterFiles.push(chapterName);

        const paragraphs = pages[i].split('\n').filter(l => l.trim().length > 0);
        const bodyHtml = paragraphs.length > 0
            ? paragraphs.map(p => `    <p>${escXml(p)}</p>`).join('\n')
            : '    <p></p>';

        zip.file(`OEBPS/${chapterName}`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Page ${i + 1}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h2>Page ${i + 1}</h2>
${bodyHtml}
</body>
</html>`);
    }

    onProgress?.(80);

    // Table of contents
    const tocItems = chapterFiles.map((f, i) =>
        `    <li><a href="${f}">Page ${i + 1}</a></li>`
    ).join('\n');

    zip.file('OEBPS/toc.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>`);

    // NCX (for EPUB 2 readers compatibility)
    const ncxNavPoints = chapterFiles.map((f, i) =>
        `    <navPoint id="ch${i + 1}" playOrder="${i + 1}">
      <navLabel><text>Page ${i + 1}</text></navLabel>
      <content src="${f}"/>
    </navPoint>`
    ).join('\n');

    zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="pdfworker-${Date.now()}"/>
  </head>
  <docTitle><text>${escXml(title)}</text></docTitle>
  <navMap>
${ncxNavPoints}
  </navMap>
</ncx>`);

    // OPF (package document)
    const manifestItems = [
        '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
        '    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        '    <item id="style" href="style.css" media-type="text/css"/>',
        ...chapterFiles.map((f, i) =>
            `    <item id="ch${i + 1}" href="${f}" media-type="application/xhtml+xml"/>`
        ),
    ].join('\n');

    const spineItems = chapterFiles.map((_, i) =>
        `    <itemref idref="ch${i + 1}"/>`
    ).join('\n');

    zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">pdfworker-${Date.now()}</dc:identifier>
    <dc:title>${escXml(title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>PDF Worker</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`);

    onProgress?.(90);

    const epubBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });

    onProgress?.(100);
    return epubBlob;
}
