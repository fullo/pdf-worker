interface VitalMetric {
    name: 'CLS' | 'LCP' | 'INP';
    value: number;
}

type VitalCallback = (metric: VitalMetric) => void;

export function useWebVitals(onMetric: VitalCallback) {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // LCP (Largest Contentful Paint)
    try {
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) onMetric({ name: 'LCP', value: last.startTime });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* unsupported */ }

    // CLS (Cumulative Layout Shift)
    try {
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value;
                }
            }
            onMetric({ name: 'CLS', value: clsValue });
        }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* unsupported */ }

    // INP (Interaction to Next Paint)
    try {
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                onMetric({ name: 'INP', value: (entry as any).duration });
            }
        }).observe({ type: 'event', buffered: true, durationThreshold: 40 } as any);
    } catch { /* unsupported */ }
}
