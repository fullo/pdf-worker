# PDF Worker

Privacy-first, client-side PDF toolkit with 36 tools. All processing runs in the browser via Web Workers — no files leave the user's device.

- **Domain**: www.pdfworker.eu / fullo.github.io/pdf-worker
- **Stack**: Vue 3 + TypeScript + Vite + Tailwind CSS
- **Hosting**: GitHub Pages (static CDN, no server)

## Build

```bash
npm install
npm run dev     # dev server on :5173
npm run build   # production build → docs/
```

## Sustainability tracking

These files are the single source of truth for sustainability data. Update them when adding tools, changing architecture, or modifying dependencies.

### SCI (Software Carbon Intensity)

- `sci-report/latest-results.json` — per-tool carbon benchmark data (imported by `SciReport.vue`)
- `sci-report/sci-history.json` — historical SCI measurements across commits
- `sci-report/METHODOLOGY.md` — SCI measurement methodology (wall time, energy model, embodied carbon)
- `lib/sci-profiler/` — git submodule → [fullo/sci-profiler](https://github.com/fullo/sci-profiler)

### WSG (Web Sustainability Guidelines)

- `wsg-report/wsg-compliance.json` — WSG 1.0 guideline compliance data (imported by `Sustainability.vue`)
- `wsg-report/WSG.md` — human-readable compliance report, git-diffable

When modifying the project, check if changes affect WSG compliance:
- Adding a third-party script → review guideline 3.6
- Adding server-side processing → review section 4 (Hosting/Infrastructure)
- Changing data collection practices → review guidelines 5.18, 4.12
- Adding new UI patterns → review section 2 (User Experience Design)

## Key architecture decisions

- **Client-side only**: zero server processing, zero file uploads
- **Lazy-loaded workers**: each tool's code loads on demand via dynamic imports
- **Tree-shaking**: SCI profiler is dev-only (`import.meta.env.DEV`), stripped from production
- **System fonts**: no web font downloads, zero font-related network requests
- **i18n**: all tool UI is translatable, but SCI Report and WSG Report are English-only
