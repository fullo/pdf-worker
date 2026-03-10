/**
 * SCI (Software Carbon Intensity) profiler for PDF services.
 *
 * Measures wall time via performance.now() around runInWorker calls,
 * then computes SCI = ((E × I) + M) / R per the Green Software Foundation spec.
 *
 * Constants sourced from:
 * - Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)
 * - CarbonRunner GitHub Actions Carbon Calculator (grid intensity)
 * - Eclectic Light Co. (M1 Pro power measurements)
 */
import { runInWorker } from '../runInWorker';

// ── SCI Constants ───────────────────────────────────────────────────────────
/** Software-attributable device power in Watts (M1 Pro: CPU ~7W + mem ctrl ~6W + SSD/system ~5W) */
export const DEVICE_POWER_W = 18;

/** Grid carbon intensity in gCO2eq/kWh (GitHub Actions median) */
export const CARBON_INTENSITY = 332;

/** Embodied carbon in grams CO2e (Apple LCA: 271kg total − 59.6kg use-phase) */
export const EMBODIED_TOTAL_G = 211_000;

/** Expected device lifetime in hours (Apple LCA: 4 years × 365d × 8h/d) */
export const LIFETIME_HOURS = 11_680;

// ── Types ───────────────────────────────────────────────────────────────────
export interface ProfileResult {
    tool: string;
    wallTimeMs: number;
    inputSizeBytes: number;
    outputSizeBytes: number;
    heapDeltaBytes: number | null;
    energyKwh: number;
    carbonOperationalMg: number;
    carbonEmbodiedMg: number;
    sciMgCO2eq: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function getHeapUsed(): number | null {
    const mem = (performance as any).memory;
    return mem ? mem.usedJSHeapSize : null;
}

function blobSize(result: Blob | { name: string; blob: Blob }[]): number {
    if (result instanceof Blob) return result.size;
    return result.reduce((sum, r) => sum + r.blob.size, 0);
}

function totalFileSize(files: File[]): number {
    return files.reduce((sum, f) => sum + f.size, 0);
}

// ── Core ────────────────────────────────────────────────────────────────────
/**
 * Profile a single tool invocation, measuring wall time and computing SCI.
 */
export async function profileTool(
    tool: string,
    files: File[],
    options: Record<string, any> = {},
): Promise<ProfileResult> {
    const inputSizeBytes = totalFileSize(files);
    const heapBefore = getHeapUsed();

    const t0 = performance.now();
    const result = await runInWorker(tool, files, options);
    const t1 = performance.now();

    const heapAfter = getHeapUsed();
    const wallTimeMs = t1 - t0;
    const wallTimeS = wallTimeMs / 1000;

    // E = energy in kWh
    const energyKwh = (DEVICE_POWER_W * wallTimeS) / 3_600_000;

    // Operational carbon = E × I (in mg for readability)
    const carbonOperationalMg = energyKwh * CARBON_INTENSITY * 1_000_000;

    // Embodied carbon amortized to this operation (in mg)
    // M = (EMBODIED_TOTAL_G / LIFETIME_HOURS) × (wallTimeS / 3600) → grams, × 1000 → mg
    const carbonEmbodiedMg = (EMBODIED_TOTAL_G / LIFETIME_HOURS) * (wallTimeS / 3600) * 1000;

    // SCI = ((E × I) + M) / R, R=1, result in mg CO2eq
    const sciMgCO2eq = carbonOperationalMg + carbonEmbodiedMg;

    return {
        tool,
        wallTimeMs: Math.round(wallTimeMs),
        inputSizeBytes,
        outputSizeBytes: blobSize(result),
        heapDeltaBytes: heapBefore !== null && heapAfter !== null ? heapAfter - heapBefore : null,
        energyKwh,
        carbonOperationalMg,
        carbonEmbodiedMg,
        sciMgCO2eq,
    };
}

// ── Output formatters ───────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function printResult(r: ProfileResult): void {
    console.log(
        `%c[SCI] %c${r.tool}%c  ${r.wallTimeMs}ms  ${r.sciMgCO2eq.toFixed(3)} mgCO₂eq  (E=${r.carbonOperationalMg.toFixed(3)}mg + M=${r.carbonEmbodiedMg.toFixed(3)}mg)  in=${formatBytes(r.inputSizeBytes)} out=${formatBytes(r.outputSizeBytes)}`,
        'color: #22c55e; font-weight: bold',
        'color: #3b82f6; font-weight: bold',
        'color: inherit',
    );
}

export function printSummary(results: ProfileResult[]): void {
    const tableData = results.map((r) => ({
        Tool: r.tool,
        'Time (ms)': r.wallTimeMs,
        'Input': formatBytes(r.inputSizeBytes),
        'Output': formatBytes(r.outputSizeBytes),
        'E (mgCO₂)': +r.carbonOperationalMg.toFixed(3),
        'M (mgCO₂)': +r.carbonEmbodiedMg.toFixed(3),
        'SCI (mgCO₂eq)': +r.sciMgCO2eq.toFixed(3),
    }));

    console.table(tableData);

    const totalSci = results.reduce((sum, r) => sum + r.sciMgCO2eq, 0);
    const totalTime = results.reduce((sum, r) => sum + r.wallTimeMs, 0);
    console.log(
        `%c[SCI Summary] %c${results.length} tools  |  Total: ${totalSci.toFixed(3)} mgCO₂eq  |  ${totalTime}ms wall time`,
        'color: #22c55e; font-weight: bold',
        'color: inherit; font-weight: bold',
    );
}

/**
 * Generate a markdown report table from profiling results.
 */
export function generateMarkdownReport(results: ProfileResult[], meta: { commit: string; machine: string }): string {
    const lines: string[] = [
        `# SCI Benchmark Report`,
        '',
        `**Date**: ${new Date().toISOString()}`,
        `**Commit**: ${meta.commit}`,
        `**Machine**: ${meta.machine}`,
        `**Constants**: E power=${DEVICE_POWER_W}W, I=${CARBON_INTENSITY} gCO₂eq/kWh, M embodied=${EMBODIED_TOTAL_G}g, lifetime=${LIFETIME_HOURS}h`,
        `**LCA Source**: Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)`,
        '',
        '| Tool | Time (ms) | Input | Output | E (mgCO₂) | M (mgCO₂) | SCI (mgCO₂eq) |',
        '|------|-----------|-------|--------|------------|------------|----------------|',
    ];

    for (const r of results) {
        lines.push(
            `| ${r.tool} | ${r.wallTimeMs} | ${formatBytes(r.inputSizeBytes)} | ${formatBytes(r.outputSizeBytes)} | ${r.carbonOperationalMg.toFixed(3)} | ${r.carbonEmbodiedMg.toFixed(3)} | ${r.sciMgCO2eq.toFixed(3)} |`,
        );
    }

    const totalSci = results.reduce((sum, r) => sum + r.sciMgCO2eq, 0);
    const totalTime = results.reduce((sum, r) => sum + r.wallTimeMs, 0);
    lines.push('', `**Total**: ${totalSci.toFixed(3)} mgCO₂eq across ${results.length} tools in ${totalTime}ms`);

    return lines.join('\n');
}

/**
 * Generate a JSON report entry for appending to sci-history.json.
 */
export function generateJsonReport(results: ProfileResult[], meta: { commit: string; machine: string }): object {
    return {
        commit: meta.commit,
        date: new Date().toISOString(),
        machine: meta.machine,
        lcaSource: 'Apple 14-inch MacBook Pro PER Oct 2021',
        constants: {
            devicePowerW: DEVICE_POWER_W,
            carbonIntensity: CARBON_INTENSITY,
            embodiedG: EMBODIED_TOTAL_G,
            lifetimeH: LIFETIME_HOURS,
        },
        results: results.map((r) => ({
            service: r.tool,
            wallTimeMs: r.wallTimeMs,
            inputBytes: r.inputSizeBytes,
            outputBytes: r.outputSizeBytes,
            sciMgCO2eq: +r.sciMgCO2eq.toFixed(3),
        })),
        totalSciMg: +results.reduce((sum, r) => sum + r.sciMgCO2eq, 0).toFixed(3),
    };
}
