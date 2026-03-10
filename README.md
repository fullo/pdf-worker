# PDF Worker

A privacy-first, client-side PDF toolkit that runs entirely in your browser. **Your files never leave your device** — all processing happens locally using Web Workers.

**Live demo:** [https://fullo.github.io/pdf-worker/](https://fullo.github.io/pdf-worker/)

## Features

| Tool | Description |
|------|-------------|
| Merge PDF | Combine multiple PDFs into one |
| Split PDF | Extract pages or split into individual documents |
| Compress PDF | Reduce file size with three compression levels |
| Rotate PDF | Rotate pages by 90, 180, or 270 degrees |
| Watermark | Add text or image watermarks with opacity and positioning |
| Page Numbers | Add page numbers with customizable format and position |
| Header & Footer | Add headers/footers with `{page}` and `{total}` placeholders |
| PDF to JPG / PNG | Convert PDF pages to images |
| JPG to PDF | Convert images to PDF with orientation and margin options |
| Markdown to PDF | Convert Markdown text to styled PDF documents |
| Protect PDF | Add password protection and permission restrictions |
| Unlock PDF | Remove password protection from PDFs |
| Crop PDF | Interactive visual crop with draggable borders |
| Resize PDF | Change page size (A4, A3, Letter, Legal) |
| Redact PDF | Draw redaction areas over sensitive content |
| Edit PDF | Add text, rectangles, lines, and freehand drawings |
| Sign PDF | Draw or upload signatures and place them on pages |
| Flatten PDF | Merge form fields and annotations into page content |
| Grayscale PDF | Convert all pages to black and white |
| Organize PDF | Reorder, duplicate, or remove pages via drag-and-drop |
| Extract Images | Extract embedded images from PDFs |
| Edit Metadata | View and edit PDF metadata (title, author, keywords, etc.) |
| PDF to Text | Extract text content from PDF documents |

All output PDFs are automatically stamped with `creator: pdfworker.eu` and relevant keywords.

## Tech Stack

- **Vue 3** + TypeScript + Composition API
- **Vue Router** (hash mode for static hosting)
- **Tailwind CSS 4** (Vite plugin)
- **pdf-lib** — PDF creation and manipulation
- **pdfjs-dist** — PDF rendering and page preview
- **Vite 7** — Build tool with code splitting
- **VitePWA** — Progressive Web App with offline support

## Architecture

- **Web Workers** — All PDF processing runs in a dedicated worker thread to keep the UI responsive
- **Code splitting** — Each tool component, blog language, and heavy library is lazy-loaded on demand
- **Batch processing** — Most tools support processing multiple files at once, with ZIP download
- **SEO** — Dynamic meta tags, canonical URLs, JSON-LD structured data, and sitemap
- **Blog** — Multilingual blog with lazy-loaded articles per language and infinite scroll

## Multilingual

Supports 15 languages: English, Italian, German, French, Portuguese, Spanish, Dutch, Swedish, Finnish, Danish, Norwegian, Belgian French, Greek, Slovenian, and Czech.

Language preference is detected automatically and saved in localStorage.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `docs/` for GitHub Pages deployment.

## Updating the SCI Report

The [SCI (Software Carbon Intensity)](https://sci-guide.greensoftware.foundation/) report measures the carbon footprint of each PDF tool. It uses pre-computed data stored in `sci-report/latest-results.json` — the profiler does **not** run during production builds.

To update the benchmark data:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the browser console (the SCI profiler loads automatically in dev mode).

3. Run all benchmarks:
   ```js
   await __sciProfiler.runAll()
   ```

4. Export the JSON report and copy the output:
   ```js
   await __sciProfiler.exportReport('COMMIT_HASH', '14-inch MacBook Pro M1 Pro, 16GB, macOS 15.3')
   ```
   Copy the JSON output and save it to `sci-report/latest-results.json`.

5. Export the markdown report and copy the output:
   ```js
   await __sciProfiler.exportMarkdown('COMMIT_HASH', '14-inch MacBook Pro M1 Pro, 16GB, macOS 15.3')
   ```
   Copy the markdown output and save it to `sci-report/latest-report.md`.

6. Rebuild:
   ```bash
   npm run build
   ```

The profiler is tree-shaken from production builds — it only runs in dev mode.

## Privacy

- No file uploads — all processing is client-side
- No tracking or analytics
- No cookies (only localStorage for language preference)
- Google AdSense for ads (optional cookies)

## License

[MIT](LICENSE)
