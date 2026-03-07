import { ref } from 'vue';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

const toasts = ref<Toast[]>([]);

let counter = 0;

function add(type: Toast['type'], message: string, duration = 4000) {
    const id = `toast-${++counter}`;
    toasts.value.push({ id, type, message });
    if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
    }
}

function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
}

export function useToast() {
    return {
        toasts,
        dismiss,
        success: (msg: string) => add('success', msg),
        error: (msg: string) => add('error', msg, 6000),
        warning: (msg: string) => add('warning', msg),
        info: (msg: string) => add('info', msg),
    };
}
