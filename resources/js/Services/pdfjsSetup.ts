/**
 * Shared pdfjs-dist setup for main-thread components.
 *
 * All Vue components that need pdfjs-dist (OrganizeTool, CropTool, WatermarkTool,
 * RedactTool, SignTool, EditTool) should import from here instead of
 * importing 'pdfjs-dist' directly. This ensures GlobalWorkerOptions.workerSrc
 * is configured before any getDocument() call.
 */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
).href;

export default pdfjsLib;
