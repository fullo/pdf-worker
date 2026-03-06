# PDF Worker

A client-side PDF toolkit that runs entirely in your browser. Your files never leave your device.

**Live demo:** [https://fullo.github.io/pdf-worker/](https://fullo.github.io/pdf-worker/)

## Features

- **Merge PDF** - Combine multiple PDFs into one
- **Split PDF** - Extract pages or split into multiple documents
- **Compress PDF** - Reduce file size while maintaining quality
- **Rotate PDF** - Rotate pages by 90, 180, or 270 degrees
- **Watermark** - Add text or image watermarks
- **Page Numbers** - Add page numbers to documents
- **PDF to JPG / PNG** - Convert PDF pages to images
- **JPG to PDF** - Convert images to PDF
- **Protect / Unlock PDF** - Add or remove password protection
- **Crop PDF** - Interactive visual crop with draggable borders
- **Redact PDF** - Draw redaction areas over sensitive content
- **Edit PDF** - Add text blocks with drag-and-drop positioning
- **Sign PDF** - Draw or type signatures and place them on pages
- **Extract Images** - Extract embedded images from PDFs
- **Grayscale PDF** - Convert to black and white
- **Resize PDF** - Change page size (A4, A3, Letter, Legal)
- **Header & Footer** - Add headers and footers with placeholders
- **Organize PDF** - Reorder pages

## Tech Stack

- **Vue 3** + TypeScript
- **Vue Router** (hash mode for static hosting)
- **Tailwind CSS 4**
- **pdf-lib** - PDF creation and manipulation
- **pdfjs-dist** - PDF rendering and preview
- **Vite** - Build tool

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

## Multilingual

Supports 6 languages: English, Italian, Spanish, French, German, Portuguese.
Language preference is saved in localStorage.

## License

MIT
