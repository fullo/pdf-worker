/**
 * Client for running PDF processing in a Web Worker.
 * Falls back to main thread if workers are unavailable.
 */

let worker: Worker | null = null;
let requestId = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_TIMEOUT_MS = 60_000; // Terminate worker after 60s of inactivity

const pending = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    onProgress?: (progress: number) => void;
}>();

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        if (pending.size === 0 && worker) {
            worker.terminate();
            worker = null;
        }
    }, IDLE_TIMEOUT_MS);
}

function getWorker(): Worker {
    if (idleTimer) clearTimeout(idleTimer);
    if (!worker) {
        worker = new Worker(
            new URL('../workers/pdf.worker.ts', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (e: MessageEvent) => {
            const { id, type, progress, blob, results, error } = e.data;
            const handler = pending.get(id);
            if (!handler) return;

            if (type === 'progress') {
                handler.onProgress?.(progress);
            } else if (type === 'done') {
                pending.delete(id);
                handler.resolve(results ?? blob);
                resetIdleTimer();
            } else if (type === 'error') {
                pending.delete(id);
                handler.reject(new Error(error));
                resetIdleTimer();
            }
        };

        worker.onerror = (e: ErrorEvent) => {
            // Reject all pending requests
            for (const [id, handler] of pending) {
                handler.reject(new Error(e.message || 'Worker error'));
                pending.delete(id);
            }
            // Kill the broken worker so a new one is created
            worker?.terminate();
            worker = null;
        };
    }
    return worker;
}

/**
 * Run a PDF processing tool in a Web Worker.
 *
 * @param tool       - Tool name (e.g., 'merge-pdf', 'rotate-pdf')
 * @param files      - Input files
 * @param options    - Tool-specific options
 * @param onProgress - Progress callback (0-100)
 * @returns Single Blob for single-result tools, or array of { name, blob } for multi-result tools.
 */
const WORKER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function runInWorker(
    tool: string,
    files: File[],
    options: Record<string, any> = {},
    onProgress?: (progress: number) => void
): Promise<Blob | { name: string; blob: Blob }[]> {
    return new Promise((resolve, reject) => {
        try {
            const w = getWorker();
            const id = ++requestId;

            const timer = setTimeout(() => {
                pending.delete(id);
                reject(new Error('Operation timed out after 5 minutes'));
            }, WORKER_TIMEOUT_MS);

            pending.set(id, {
                resolve: (value) => { clearTimeout(timer); resolve(value); },
                reject: (reason) => { clearTimeout(timer); reject(reason); },
                onProgress,
            });

            w.postMessage({ id, tool, files, options });
        } catch {
            reject(new Error('Web Workers not supported'));
        }
    });
}
