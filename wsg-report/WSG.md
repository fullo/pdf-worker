# Web Sustainability Guidelines (WSG 1.0) Compliance Report

**Spec**: [W3C Web Sustainability Guidelines 1.0](https://www.w3.org/TR/web-sustainability-guidelines/)
**Date**: 2026-03-10
**Project**: PDF Worker — privacy-first, client-side PDF toolkit

## Summary

| Metric | Value |
|---|---|
| Total WSG guidelines | 80 |
| Fully addressed | 50 |
| Partially addressed | 1 |
| **Coverage** | **51 / 80** |

Guidelines not listed target server-side infrastructure or organizational processes outside this project's scope.

## Why Client-Side Matters

| Benefit | Impact |
|---|---|
| Zero server energy | No backend servers processing files 24/7. Energy cost limited to user's device. |
| Zero network transfer | Files stay on device. No upload/download bandwidth per operation. |
| Static hosting only | Served from CDN (GitHub Pages). No application servers, databases, or containers. |
| Privacy by design | No data collection, no storage infrastructure, no data retention policies. |

---

## 🎨 User Experience Design (2.1–2.21)

| ID | Guideline | Status | Detail |
|---|---|---|---|
| 2.2 | Understand user requirements or constraints, resolving barriers to access | ✅ Full | All tools work with standard PDF files in any modern browser. No account, plugin, or installation required. |
| 2.4 | Minimize non-essential content, interactivity, or journeys | ✅ Full | Each tool is a single-purpose page: drop a file, get a result. No onboarding wizards, pop-ups, or multi-step funnels. |
| 2.5 | Ensure that navigation and wayfinding are well-structured | ✅ Full | Flat navigation: home page lists all 36 tools. Each tool has a descriptive name, icon, and direct URL. |
| 2.6 | Design to assist and not to distract | ✅ Full | No autoplaying media, no animations beyond minimal transitions, no infinite scroll. |
| 2.7 | Avoid being manipulative or deceptive | ✅ Full | No dark patterns, no fake urgency, no forced sign-ups. Tool results are delivered immediately without gates. |
| 2.9 | Use a design system for interface consistency | ✅ Full | Tailwind CSS utility classes with a shared component library ensure visual consistency across all tools. |
| 2.10 | Provide clear, inclusive content with purpose | ✅ Full | Each tool has a clear title, description, and expected input/output format. Available in multiple languages via i18n. |
| 2.11 | Optimize media to reduce resource use | ✅ Full | Minimal imagery. Icons are inline SVGs. No stock photos, hero images, or video backgrounds. |
| 2.12 | Ensure animation is proportionate and easy to control | ✅ Full | Only CSS transitions for state changes (hover, toggle). Respects prefers-reduced-motion media query. |
| 2.13 | Use optimized and appropriate web typography | ✅ Full | System font stack — no custom web fonts downloaded. Zero font-related network requests. |
| 2.14 | Offer suitable alternatives for every format used | ✅ Full | Output is always a downloadable file. Multiple conversion formats available (PDF, images, text, EPUB). |
| 2.15 | Provide accessible, usable, minimal web forms | ✅ Full | Tool interfaces use minimal form elements: a file input and optional settings. No mandatory fields beyond the file itself. |
| 2.16 | Avoid unwanted notifications | ✅ Full | Zero push notifications. No email collection. No permission requests for notifications or location. |
| 2.17 | Reduce the impact of downloadable and physical documents | ✅ Full | Tools like compress-pdf, grayscale-pdf, and remove-blank-pages directly reduce document size and print impact. |
| 2.19 | Audit and test for bugs or issues requiring resolution | ✅ Full | SCI profiler runs automated benchmarks across all 36 tools. Build pipeline includes type checking and linting. |
| 2.21 | Regularly test and maintain compatibility | ✅ Full | Tested on Chrome, Firefox, Safari. Uses standard Web APIs and progressive enhancement. |

## ⚙️ Web Development (3.1–3.20)

| ID | Guideline | Status | Detail |
|---|---|---|---|
| 3.1 | Set goals based on performance and energy impact | ✅ Full | SCI profiler measures energy consumption and carbon emissions per tool. Results published in the SCI Report page. |
| 3.2 | Remove unnecessary or redundant information | ✅ Full | Production build uses Vite tree-shaking. Dev-only code (SCI profiler) is stripped from production bundles. |
| 3.3 | Modularize bandwidth-heavy components | ✅ Full | Each tool is a lazy-loaded Web Worker. Only the selected tool's code is loaded on demand. |
| 3.4 | Remove unnecessary code | ✅ Full | Vite tree-shaking + code splitting. Dead code elimination verified by grepping production bundles. |
| 3.5 | Avoid redundancy and duplication in code | ✅ Full | Shared utilities (runInWorker, file helpers) are centralized. Tool implementations follow a uniform pattern. |
| 3.6 | Give third parties the same priority as first parties during assessment | ⚠️ Partial | Google AdSense is the only third-party script. It is loaded asynchronously and does not block rendering. |
| 3.7 | Ensure code follows good semantic practices | ✅ Full | Semantic HTML5 elements (main, nav, section, article). ARIA attributes where needed. |
| 3.8 | Defer the loading of non-critical resources | ✅ Full | Route-based code splitting with dynamic imports. Tool workers load only when the user selects a tool. |
| 3.9 | Provide information to help understand the usefulness of a page | ✅ Full | SEO meta tags on every page. Structured descriptions for each tool. Open Graph metadata for sharing. |
| 3.11 | Structure metadata for machine readability | ✅ Full | SEO composable generates title, description, and Open Graph tags for every route. |
| 3.12 | Use sustainability beneficial user preference media queries | ✅ Full | Supports prefers-color-scheme (dark mode) and prefers-reduced-motion. No unnecessary resource loading for either preference. |
| 3.13 | Ensure layouts work for different devices and requirements | ✅ Full | Fully responsive design with Tailwind breakpoints (sm, md, lg). Mobile-first approach. |
| 3.14 | Use standards-based JavaScript and APIs | ✅ Full | Standard Web APIs: File API, Web Workers, Blob, performance.now(). No proprietary browser APIs. |
| 3.15 | Ensure that your code is secure | ✅ Full | All processing is client-side. No data leaves the browser. No server-side attack surface for user files. |
| 3.16 | Use dependencies appropriately and ensure maintenance | ✅ Full | Minimal dependency tree. Core libraries (pdf-lib, pdfjs-dist, tesseract.js) are actively maintained open-source projects. |
| 3.17 | Include expected and beneficial files | ✅ Full | Includes robots.txt, sitemap, privacy policy, and this sustainability page. |
| 3.18 | Use the most efficient solution for your service | ✅ Full | Client-side processing eliminates server round-trips entirely. Files never leave the user's device. |
| 3.19 | Use the latest stable language version | ✅ Full | TypeScript with ES2022 target. Vite build with modern browser output. |

## 🌐 Hosting, Infrastructure, and Systems (4.1–4.12)

| ID | Guideline | Status | Detail |
|---|---|---|---|
| 4.1 | Use sustainable hosting | ✅ Full | Hosted on GitHub Pages — a static CDN. No dedicated server running 24/7 for this application. |
| 4.2 | Optimize caching and support offline access | ✅ Full | Static assets served with long-lived cache headers via GitHub Pages CDN. Content-hashed filenames enable aggressive caching. |
| 4.3 | Reduce data transfer with compression | ✅ Full | GitHub Pages serves gzip/brotli compressed assets. Vite produces minified JS/CSS bundles. |
| 4.4 | Setup necessary error pages and redirection links | ✅ Full | Custom 404.html redirects to hash-based SPA routing. No broken links. |
| 4.5 | Avoid maintaining unnecessary virtualized environments or containers | ✅ Full | No server infrastructure at all. The entire application is a static site — zero containers, zero VMs. |
| 4.9 | Consider the impact and requirements of data processing | ✅ Full | All processing happens on the user's existing device. No additional server energy consumption per operation. |
| 4.10 | Use Content Delivery Networks (CDNs) appropriately | ✅ Full | GitHub Pages CDN distributes static assets globally. Minimal latency, no origin server required. |
| 4.12 | Store data according to the needs of your users | ✅ Full | No user data stored whatsoever — not on servers, not in databases, not in cookies (beyond consent). |

## 📋 Business Strategy and Product Management (5.1–5.27)

| ID | Guideline | Status | Detail |
|---|---|---|---|
| 5.1 | Have an ethical and sustainable product strategy | ✅ Full | Privacy-first by design. No data collection, no tracking, no user profiling. Open source codebase. |
| 5.4 | Communicate the environmental impact of user choices | ✅ Full | SCI Report page publishes per-tool carbon emissions. Users can see the environmental cost of each operation. |
| 5.5 | Calculate the environmental impact | ✅ Full | SCI profiler implements the Green Software Foundation specification to measure mgCO₂eq per tool invocation. |
| 5.11 | Implement continuous improvement procedures | ✅ Full | SCI history tracking compares carbon emissions across commits. Regressions are detectable over time. |
| 5.13 | Establish if a digital product or service is necessary | ✅ Full | PDF Worker replaces the need to upload files to remote servers for processing, reducing both privacy risk and network energy. |
| 5.18 | Promote responsible data practices | ✅ Full | Zero data collection by design. Files are processed in-browser and never transmitted. Privacy policy is explicit about this. |
| 5.23 | Plan for a digital product or service's care and end-of-life | ✅ Full | Static site with no server dependency. Even if the project is abandoned, the hosted version continues to work. |
| 5.25 | Define performance and environmental budgets | ✅ Full | SCI benchmarks define measurable carbon budgets per tool. Performance regressions are tracked in sci-history.json. |
| 5.26 | Use open source where possible | ✅ Full | All core dependencies are open source. The SCI profiler itself is published as an open-source library. |

---

## References

- [W3C — Web Sustainability Guidelines (WSG) 1.0](https://www.w3.org/TR/web-sustainability-guidelines/)
- [Green Software Foundation — SCI Specification](https://sci-guide.greensoftware.foundation/)
- [Sustainable Web Manifesto](https://www.sustainablewebmanifesto.com/)
- [SCI Profiler — Open Source Carbon Measurement Library](https://github.com/fullo/sci-profiler)
