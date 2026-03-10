# PDF Worker

A privacy-first, client-side PDF toolkit that runs entirely in your browser. **Your files never leave your device** — all processing happens locally using Web Workers.

**Live demo:** [https://fullo.github.io/pdf-worker/](https://fullo.github.io/pdf-worker/)

## Features

36 tools, all running 100% client-side:

| Tool | Description |
|------|-------------|
| Merge PDF | Combine multiple PDFs into a single file |
| Split PDF | Extract pages or split into individual documents |
| Compress PDF | Reduce file size while maintaining quality |
| Rotate PDF | Rotate pages by 90, 180, or 270 degrees |
| Watermark | Add text or image watermarks with opacity and positioning |
| Page Numbers | Add page numbers with customizable format and position |
| Header & Footer | Add headers/footers with `{page}` and `{total}` placeholders |
| PDF to JPG / PNG / WebP | Convert PDF pages to images |
| JPG to PDF | Convert images to PDF with orientation and margin options |
| Text to PDF | Convert plain text into a formatted PDF document |
| Markdown to PDF | Convert Markdown text to styled PDF documents |
| PDF to Text | Extract text content from PDF documents |
| PDF to EPUB | Convert PDF documents into EPUB ebooks |
| OCR PDF | Make scanned PDFs searchable with optical character recognition |
| Compare PDF | Compare two PDFs side by side and highlight differences |
| Protect PDF | Add password protection and permission restrictions |
| Unlock PDF | Remove password protection from PDFs |
| Crop PDF | Interactive visual crop with draggable borders |
| Resize PDF | Change page size (A4, A3, Letter, Legal) |
| N-Up PDF | Combine multiple pages onto a single sheet (2, 4, or 9 per page) |
| Redact PDF | Draw redaction areas over sensitive content |
| Edit PDF | Add text, rectangles, lines, and freehand drawings |
| Sign PDF | Draw or upload signatures and place them on pages |
| Flatten PDF | Merge form fields and annotations into page content |
| Grayscale PDF | Convert all pages to black and white |
| Invert Colors | Invert all colors in a PDF for a negative effect |
| Organize PDF | Reorder, duplicate, or remove pages via drag-and-drop |
| Reverse Pages | Reverse the order of all pages |
| Add Blank Page | Insert a blank page at the beginning or end |
| Remove Blank Pages | Automatically detect and remove blank pages |
| Extract Images | Extract embedded images from PDFs |
| Edit Metadata | View and edit PDF metadata (title, author, keywords, etc.) |
| Repair PDF | Attempt to repair corrupted or damaged PDF files |
| PDF Booklet | Rearrange pages for double-sided booklet printing |

All output PDFs are automatically stamped with `creator: pdfworker.eu` and relevant keywords.

## Tech Stack

- **Vue 3** + TypeScript + Composition API
- **Vue Router** (hash mode for static hosting)
- **Tailwind CSS 4** (Vite plugin)
- **pdf-lib** — PDF creation and manipulation
- **pdfjs-dist** — PDF rendering and page preview
- **tesseract.js** — OCR engine for scanned documents
- **Vite 7** — Build tool with code splitting
- **VitePWA** — Progressive Web App with offline support

## Architecture

- **Web Workers** — All PDF processing runs in a dedicated worker thread to keep the UI responsive
- **Code splitting** — Each tool component, blog language, and heavy library is lazy-loaded on demand
- **Batch processing** — Most tools support processing multiple files at once, with ZIP download
- **Client-side only** — Zero server processing, zero file uploads, zero backend infrastructure
- **SEO** — Dynamic meta tags, canonical URLs, JSON-LD structured data, and sitemap
- **Blog** — Multilingual blog with lazy-loaded articles per language and infinite scroll

## Multilingual

Supports 15 languages: English, Italian, German, French, Portuguese, Spanish, Dutch, Swedish, Finnish, Danish, Norwegian, Belgian French, Greek, Slovenian, and Czech.

Language preference is detected automatically and saved in localStorage.

## Development

```bash
git clone --recurse-submodules https://github.com/fullo/pdf-worker.git
cd pdf-worker
npm install
npm run dev
```

> The `--recurse-submodules` flag fetches the [SCI profiler](https://github.com/fullo/sci-profiler) submodule at `lib/sci-profiler`. If you already cloned without it, run `git submodule update --init`.

## Build

```bash
npm run build
```

Output goes to `docs/` for GitHub Pages deployment.

## Testing

```bash
npm run test              # run all tests once
npm run test:watch        # watch mode (re-runs on file changes)
npm run test:coverage     # coverage report
```

Tests use [Vitest](https://vitest.dev/) and cover the 22 pdf-lib-based PDF services (136 tests). Each service has a co-located `.test.ts` file under `resources/js/Services/`.

## Accessibility & Quality Audit

Automated Lighthouse CI audit for accessibility, performance, and best practices:

```bash
npm run audit:a11y
```

Audits four representative pages (home, tool, SCI report, WSG report) against these thresholds:

| Category | Threshold | Level |
|----------|-----------|-------|
| Accessibility | 90% | Error |
| Performance | 80% | Warning |
| Best Practices | 90% | Warning |

Configuration lives in `lighthouserc.json`. Reports are saved to `.lighthouseci/`.

## Sustainability

PDF Worker actively tracks its environmental impact through two complementary approaches.

### SCI Report — Carbon Footprint

The [SCI (Software Carbon Intensity)](https://sci-guide.greensoftware.foundation/) report measures the carbon footprint of each PDF tool. It uses the [SCI profiler](https://github.com/fullo/sci-profiler) (included as a git submodule) to benchmark energy consumption, embodied carbon, and CO2 emissions per tool invocation.

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
   await __sciProfiler.exportReport('COMMIT_HASH')
   ```
   Copy the JSON output and save it to `sci-report/latest-results.json`.

5. Export the markdown report and copy the output:
   ```js
   await __sciProfiler.exportMarkdown('COMMIT_HASH')
   ```
   Copy the markdown output and save it to `sci-report/latest-report.md`.

6. Rebuild:
   ```bash
   npm run build
   ```

The profiler is tree-shaken from production builds — it only runs in dev mode.

#### Custom device parameters

The SCI profiler ships with default constants for a 14-inch MacBook Pro M1 Pro. If you're running on a different machine, configure your own parameters **before** running benchmarks:

```js
__sciProfiler.configure({
    devicePowerW: 25,           // Your device's software-attributable power (Watts)
    carbonIntensity: 450,       // Grid carbon intensity (gCO2eq/kWh) for your region
    embodiedTotalG: 300_000,    // Embodied carbon (g CO2e) from your device's LCA
    lifetimeHours: 14_600,      // Expected lifetime (hours): e.g. 5 years x 365d x 8h
    lcaSource: 'Dell XPS 15 Product Carbon Footprint 2024',
    machine: 'Dell XPS 15 9530, i7-13700H, 32GB, Ubuntu 24.04',
})
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `devicePowerW` | 18 | Software-attributable device power (Watts) |
| `carbonIntensity` | 332 | Grid carbon intensity (gCO2eq/kWh) |
| `embodiedTotalG` | 211,000 | Embodied carbon excluding use-phase (grams CO2e) |
| `lifetimeHours` | 11,680 | Device lifetime (hours) |
| `lcaSource` | Apple 14-inch MacBook Pro PER Oct 2021 | LCA data source description |
| `machine` | 14-inch MacBook Pro M1 Pro, 16GB, macOS 15.3 | Machine description for reports |

### WSG Report — Web Sustainability Guidelines

The [WSG report](https://fullo.github.io/pdf-worker/#/sustainability) maps how PDF Worker aligns with the [W3C Web Sustainability Guidelines (WSG) 1.0](https://www.w3.org/TR/web-sustainability-guidelines/) — 80 guidelines across four categories: User Experience Design, Web Development, Hosting & Infrastructure, and Business Strategy.

Current coverage: **51 / 80 guidelines** (50 fully addressed, 1 partial). The remaining guidelines target server-side infrastructure or organizational processes outside the project's scope.

Compliance data lives in `wsg-report/wsg-compliance.json` (single source of truth imported by the Vue page) and `wsg-report/WSG.md` (human-readable, git-diffable report).

## Privacy

- No file uploads — all processing is client-side
- No tracking or analytics
- No cookies (only localStorage for language preference)
- Google AdSense for ads (optional cookies)

## License

[MIT](LICENSE)
