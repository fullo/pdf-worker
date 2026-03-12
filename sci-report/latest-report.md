# SCI Benchmark Report

**Date**: 2026-03-12T13:30:01.732Z
**Commit**: 4adf2f8
**Machine**: MacBook dev machine
**Constants**: E power=18W, I=332 gCO₂eq/kWh, M embodied=211000g, lifetime=11680h
**LCA Source**: Apple 14-inch MacBook Pro PER Oct 2021

| Tool | Time (ms) | Input | Output | E (mgCO₂) | M (mgCO₂) | SCI (mgCO₂eq) |
|------|-----------|-------|--------|------------|------------|----------------|
| merge-pdf | 93 | 46.4 KB | 44.7 KB | 154.214 | 0.466 | 154.680 |
| split-pdf | 6 | 23.2 KB | 21.7 KB | 9.794 | 0.030 | 9.824 |
| compress-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| rotate-pdf | 4 | 23.2 KB | 23.2 KB | 7.138 | 0.022 | 7.160 |
| watermark-pdf | 22 | 23.2 KB | 25.6 KB | 37.018 | 0.112 | 37.130 |
| page-numbers | 6 | 23.2 KB | 25.2 KB | 9.960 | 0.030 | 9.990 |
| pdf-to-jpg | 221 | 23.2 KB | 1.03 MB | 367.358 | 1.110 | 368.468 |
| organize-pdf | 4 | 23.2 KB | 23.2 KB | 6.308 | 0.019 | 6.327 |
| crop-pdf | 5 | 23.2 KB | 23.2 KB | 7.802 | 0.024 | 7.826 |
| pdf-to-png | 221 | 23.2 KB | 1.59 MB | 367.524 | 1.111 | 368.635 |
| extract-images | 18 | 23.2 KB | 723 B | 29.216 | 0.088 | 29.304 |
| grayscale-pdf | 409 | 23.2 KB | 1.08 MB | 678.442 | 2.051 | 680.493 |
| resize-pdf | 219 | 23.2 KB | 1.29 MB | 364.038 | 1.100 | 365.138 |
| header-footer | 6 | 23.2 KB | 25.9 KB | 9.628 | 0.029 | 9.657 |
| flatten-pdf | 7 | 23.2 KB | 23.2 KB | 10.956 | 0.033 | 10.989 |
| pdf-to-text | 27 | 23.2 KB | 8.3 KB | 44.654 | 0.135 | 44.789 |
| edit-metadata | 3 | 23.2 KB | 23.1 KB | 4.482 | 0.014 | 4.496 |
| pdf-to-webp | 1188 | 23.2 KB | 534.4 KB | 1972.578 | 5.963 | 1978.541 |
| nup-pdf | 874 | 23.2 KB | 545.8 KB | 1451.172 | 4.387 | 1455.559 |
| add-blank-page | 10 | 23.2 KB | 23.2 KB | 17.098 | 0.052 | 17.150 |
| remove-blank-pages | 74 | 23.2 KB | 23.2 KB | 122.342 | 0.370 | 122.712 |
| ocr-pdf | 13651 | 23.2 KB | 939.6 KB | 22660.328 | 68.501 | 22728.829 |
| compare-pdf | 3843 | 46.4 KB | 865.1 KB | 6379.380 | 19.284 | 6398.664 |
| reverse-pages | 10 | 23.2 KB | 23.1 KB | 16.766 | 0.051 | 16.817 |
| invert-colors | 2911 | 23.2 KB | 939.6 KB | 4831.762 | 14.606 | 4846.368 |
| repair-pdf | 8 | 23.2 KB | 23.1 KB | 12.450 | 0.038 | 12.488 |
| pdf-to-epub | 62 | 23.2 KB | 19.6 KB | 103.418 | 0.313 | 103.731 |
| booklet-pdf | 10 | 23.2 KB | 23.1 KB | 16.268 | 0.049 | 16.317 |
| text-to-pdf | 13 | 0 B | 2.8 KB | 21.912 | 0.066 | 21.978 |
| markdown-to-pdf | 27 | 0 B | 1.7 KB | 44.322 | 0.134 | 44.456 |
| protect-pdf | 370 | 23.2 KB | 1.36 MB | 613.868 | 1.856 | 615.724 |
| jpg-to-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| unlock-pdf | 290 | 1.36 MB | 1.33 MB | 482.064 | 1.457 | 483.521 |
| redact-pdf | 16 | 23.2 KB | 23.5 KB | 25.896 | 0.078 | 25.974 |
| sign-pdf | 12 | 23.2 KB | 23.9 KB | 19.754 | 0.060 | 19.814 |
| edit-pdf | 11 | 23.2 KB | 23.5 KB | 18.924 | 0.057 | 18.981 |

**Total**: 41042.529 mgCO₂eq across 36 tools in 24651ms
