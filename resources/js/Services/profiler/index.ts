/**
 * SCI Profiler — tool registry and window.__sciProfiler API.
 *
 * Maps all 36 PDF tools to their worker name + argument builder.
 * Attaches a global API for running benchmarks from the browser console.
 */
import { generateBenchmarkPdf } from './benchmarkPdf';
import { runInWorker } from '../runInWorker';
import {
    profileTool,
    printResult,
    printSummary,
    generateMarkdownReport,
    generateJsonReport,
    configureSci,
    resetSciConfig,
    getSciConfig,
    type ProfileResult,
    type SciConfig,
} from './sciProfiler';

// ── Project-specific helpers ────────────────────────────────────────────────
function blobSize(result: Blob | { name: string; blob: Blob }[]): number {
    if (result instanceof Blob) return result.size;
    return result.reduce((sum, r) => sum + r.blob.size, 0);
}

function totalFileSize(files: File[]): number {
    return files.reduce((sum, f) => sum + f.size, 0);
}

/** Profile a PDF tool via runInWorker, measuring input/output sizes. */
function profilePdfTool(name: string, files: File[], options: Record<string, any>): Promise<ProfileResult> {
    return profileTool(
        name,
        () => runInWorker(name, files, options),
        totalFileSize(files),
        blobSize,
    );
}

// ── Types ───────────────────────────────────────────────────────────────────
interface ToolEntry {
    /** Worker tool name (must match switch case in pdf.worker.ts) */
    name: string;
    /** Build the files + options for this tool. Receives the benchmark PDF File. */
    args: (benchmarkFile: File) => { files: File[]; options: Record<string, any> };
    /** If true, this tool needs a prerequisite step before profiling */
    chain?: (benchmarkFile: File) => Promise<{ files: File[]; options: Record<string, any> }>;
}

// ── Small data URL for sign-pdf benchmark ───────────────────────────────────
// 1x1 red pixel PNG as a minimal signature image
const TINY_SIGNATURE_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// ── Lorem ipsum for text-based tools ────────────────────────────────────────
const LOREM_100 = Array(100)
    .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
    .join(' ');

const MARKDOWN_SAMPLE = `# Benchmark Document

## Introduction
This is a benchmark markdown document for SCI profiling.

## Content
- Item one with **bold** text
- Item two with *italic* text
- Item three with \`inline code\`

## Table

| Column A | Column B | Column C |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

## Conclusion
End of benchmark markdown content.
`;

// ── Tool Registry ───────────────────────────────────────────────────────────
const TOOL_REGISTRY: ToolEntry[] = [
    // ─── Direct tools (pass benchmark PDF) ──────────────────────────────
    {
        name: 'merge-pdf',
        args: (f) => ({ files: [f, f], options: {} }),
    },
    {
        name: 'split-pdf',
        args: (f) => ({ files: [f], options: { mode: 'range', ranges: '1-5,6-10' } }),
    },
    {
        name: 'compress-pdf',
        args: (f) => ({ files: [f], options: { level: 'medium' } }),
    },
    {
        name: 'rotate-pdf',
        args: (f) => ({ files: [f], options: { angle: 90 } }),
    },
    {
        name: 'watermark-pdf',
        args: (f) => ({
            files: [f],
            options: { type: 'text', text: 'BENCHMARK', opacity: 0.3, xPercent: 50, yPercent: 50 },
        }),
    },
    {
        name: 'page-numbers',
        args: (f) => ({ files: [f], options: { position: 'bottom-center', format: 'number' } }),
    },
    {
        name: 'pdf-to-jpg',
        args: (f) => ({ files: [f], options: { quality: 0.8 } }),
    },
    {
        name: 'organize-pdf',
        args: (f) => ({ files: [f], options: { type: 'reorder', pageOrder: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] } }),
    },
    {
        name: 'crop-pdf',
        args: (f) => ({ files: [f], options: { top: 50, bottom: 50, left: 50, right: 50 } }),
    },
    {
        name: 'pdf-to-png',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'extract-images',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'grayscale-pdf',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'resize-pdf',
        args: (f) => ({ files: [f], options: { targetSize: 'a4' } }),
    },
    {
        name: 'header-footer',
        args: (f) => ({
            files: [f],
            options: {
                header: { text: 'Benchmark Header', align: 'center' },
                footer: { text: 'Page {n}', align: 'center' },
            },
        }),
    },
    {
        name: 'flatten-pdf',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'pdf-to-text',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'edit-metadata',
        args: (f) => ({
            files: [f],
            options: { title: 'Benchmark Edited', author: 'SCI Profiler', subject: 'Test', keywords: ['benchmark', 'test'] },
        }),
    },
    {
        name: 'pdf-to-webp',
        args: (f) => ({ files: [f], options: { quality: 0.8 } }),
    },
    {
        name: 'nup-pdf',
        args: (f) => ({ files: [f], options: { layout: 4 } }),
    },
    {
        name: 'add-blank-page',
        args: (f) => ({ files: [f], options: { position: 'end' } }),
    },
    {
        name: 'remove-blank-pages',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'ocr-pdf',
        args: (f) => ({ files: [f], options: { language: 'eng' } }),
    },
    {
        name: 'compare-pdf',
        args: (f) => ({ files: [f, f], options: {} }),
    },
    {
        name: 'reverse-pages',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'invert-colors',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'repair-pdf',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'pdf-to-epub',
        args: (f) => ({ files: [f], options: {} }),
    },
    {
        name: 'booklet-pdf',
        args: (f) => ({ files: [f], options: {} }),
    },

    // ─── Special input tools ────────────────────────────────────────────
    {
        name: 'text-to-pdf',
        args: () => ({ files: [], options: { text: LOREM_100 } }),
    },
    {
        name: 'markdown-to-pdf',
        args: () => ({ files: [], options: { markdown: MARKDOWN_SAMPLE } }),
    },
    {
        name: 'protect-pdf',
        args: (f) => ({ files: [f], options: { userPassword: 'benchmark123', ownerPassword: 'owner456' } }),
    },

    // ─── Chained tools ──────────────────────────────────────────────────
    {
        name: 'jpg-to-pdf',
        args: () => ({ files: [], options: {} }), // placeholder, overridden by chain
        chain: async (f) => {
            // First generate JPGs from the benchmark PDF
            const { runInWorker: run } = await import('../runInWorker');
            const result = await run('pdf-to-jpg', [f], { quality: 0.8 });
            if (Array.isArray(result)) {
                // Take first 3 images to keep it reasonable
                const imageFiles = result.slice(0, 3).map(
                    (r) => new File([r.blob], r.name, { type: 'image/jpeg' }),
                );
                return { files: imageFiles, options: {} };
            }
            // Fallback: single blob
            return { files: [new File([result], 'page.jpg', { type: 'image/jpeg' })], options: {} };
        },
    },
    {
        name: 'unlock-pdf',
        args: () => ({ files: [], options: {} }), // placeholder, overridden by chain
        chain: async (f) => {
            // First protect the PDF, then unlock it
            const { runInWorker: run } = await import('../runInWorker');
            const protectedBlob = await run('protect-pdf', [f], {
                userPassword: 'benchmark123',
                ownerPassword: 'owner456',
            });
            if (protectedBlob instanceof Blob) {
                const protectedFile = new File([protectedBlob], 'protected.pdf', { type: 'application/pdf' });
                return { files: [protectedFile], options: { password: 'benchmark123' } };
            }
            throw new Error('protect-pdf did not return a Blob');
        },
    },

    // ─── Complex tools (minimal config) ─────────────────────────────────
    {
        name: 'redact-pdf',
        args: (f) => ({
            files: [f],
            options: { areas: [{ pageIndex: 0, x: 50, y: 700, width: 200, height: 30 }] },
        }),
    },
    {
        name: 'sign-pdf',
        args: (f) => ({
            files: [f],
            options: {
                type: 'draw',
                pageIndex: 0,
                x: 350,
                y: 100,
                width: 150,
                height: 50,
                drawDataUrl: TINY_SIGNATURE_DATA_URL,
            },
        }),
    },
    {
        name: 'edit-pdf',
        args: (f) => ({
            files: [f],
            options: {
                elements: [
                    { type: 'text', pageIndex: 0, x: 200, y: 400, text: 'Benchmark Edit', fontSize: 16 },
                ],
            },
        }),
    },
];

// ── Runner ──────────────────────────────────────────────────────────────────
const INTER_TOOL_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSingleBenchmark(toolName: string): Promise<ProfileResult> {
    const entry = TOOL_REGISTRY.find((t) => t.name === toolName);
    if (!entry) throw new Error(`Unknown tool: ${toolName}. Available: ${TOOL_REGISTRY.map((t) => t.name).join(', ')}`);

    const benchmarkFile = await generateBenchmarkPdf();

    let files: File[];
    let options: Record<string, any>;

    if (entry.chain) {
        const chainResult = await entry.chain(benchmarkFile);
        files = chainResult.files;
        options = chainResult.options;
    } else {
        const args = entry.args(benchmarkFile);
        files = args.files;
        options = args.options;
    }

    const result = await profilePdfTool(toolName, files, options);
    printResult(result);
    return result;
}

async function runAllBenchmarks(): Promise<ProfileResult[]> {
    const benchmarkFile = await generateBenchmarkPdf();
    console.log(
        `%c[SCI] Starting benchmark of ${TOOL_REGISTRY.length} tools with ${(benchmarkFile.size / 1024).toFixed(0)}KB reference PDF`,
        'color: #22c55e; font-weight: bold',
    );

    const results: ProfileResult[] = [];

    for (const entry of TOOL_REGISTRY) {
        try {
            let files: File[];
            let options: Record<string, any>;

            if (entry.chain) {
                console.log(`%c[SCI] %cPreparing chained input for ${entry.name}...`, 'color: #22c55e', 'color: #94a3b8');
                const chainResult = await entry.chain(benchmarkFile);
                files = chainResult.files;
                options = chainResult.options;
            } else {
                const args = entry.args(benchmarkFile);
                files = args.files;
                options = args.options;
            }

            const result = await profilePdfTool(entry.name, files, options);
            printResult(result);
            results.push(result);
        } catch (err: any) {
            console.warn(`%c[SCI] %c${entry.name} failed: ${err?.message}`, 'color: #22c55e', 'color: #ef4444');
            results.push({
                tool: entry.name,
                wallTimeMs: 0,
                inputSizeBytes: 0,
                outputSizeBytes: 0,
                heapDeltaBytes: null,
                energyKwh: 0,
                carbonOperationalMg: 0,
                carbonEmbodiedMg: 0,
                sciMgCO2eq: 0,
            });
        }

        await delay(INTER_TOOL_DELAY_MS);
    }

    printSummary(results);
    return results;
}

// ── Window API ──────────────────────────────────────────────────────────────
declare global {
    interface Window {
        __sciProfiler?: {
            tools: string[];
            configure: (overrides: Partial<SciConfig>) => SciConfig;
            resetConfig: () => SciConfig;
            getConfig: () => SciConfig;
            runBenchmark: (tool: string) => Promise<ProfileResult>;
            runAll: () => Promise<ProfileResult[]>;
            generateBenchmarkPdf: () => Promise<File>;
            exportReport: (commit?: string, machine?: string) => Promise<object>;
            exportMarkdown: (commit?: string, machine?: string) => Promise<string>;
        };
    }
}

export function attachProfiler(): void {
    let lastResults: ProfileResult[] | null = null;

    window.__sciProfiler = {
        tools: TOOL_REGISTRY.map((t) => t.name),

        configure: configureSci,
        resetConfig: resetSciConfig,
        getConfig: getSciConfig,

        runBenchmark: runSingleBenchmark,

        runAll: async () => {
            lastResults = await runAllBenchmarks();
            return lastResults;
        },

        generateBenchmarkPdf: async () => {
            const f = await generateBenchmarkPdf();
            console.log(`%c[SCI] Benchmark PDF: ${(f.size / 1024).toFixed(0)}KB, ${f.name}`, 'color: #22c55e; font-weight: bold');
            return f;
        },

        exportReport: async (commit = 'unknown', machine?: string) => {
            const results = lastResults ?? await runAllBenchmarks();
            lastResults = results;
            const report = generateJsonReport(results, { commit, machine });
            console.log(JSON.stringify(report, null, 2));
            return report;
        },

        exportMarkdown: async (commit = 'unknown', machine?: string) => {
            const results = lastResults ?? await runAllBenchmarks();
            lastResults = results;
            const md = generateMarkdownReport(results, { commit, machine });
            console.log(md);
            return md;
        },
    };

    console.log(
        `%c[SCI Profiler] Ready — ${TOOL_REGISTRY.length} tools registered. Use __sciProfiler.runAll() or __sciProfiler.runBenchmark('tool-name')`,
        'color: #22c55e; font-weight: bold',
    );
}
