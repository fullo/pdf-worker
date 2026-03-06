import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { ProcessingState } from '@/types';
import { saveAs } from 'file-saver';

export function usePdfTool() {
    const state: Ref<ProcessingState> = ref({
        status: 'idle',
        progress: 0,
        message: '',
    });

    const resultBlob: Ref<Blob | null> = ref(null);
    const resultFileName: Ref<string> = ref('');

    const resultUrl: ComputedRef<string> = computed(() => {
        if (resultBlob.value) {
            return URL.createObjectURL(resultBlob.value);
        }
        return '';
    });

    function startProcessing(): void {
        state.value = {
            status: 'processing',
            progress: 0,
            message: '',
        };
    }

    function updateProgress(progress: number): void {
        state.value.progress = Math.min(Math.max(progress, 0), 100);
    }

    function finishProcessing(): void {
        state.value = {
            status: 'done',
            progress: 100,
            message: '',
        };
    }

    function setError(message: string): void {
        state.value = {
            status: 'error',
            progress: 0,
            message,
        };
    }

    function reset(): void {
        // Revoke previous object URL if it exists
        if (resultBlob.value) {
            URL.revokeObjectURL(resultUrl.value);
        }

        state.value = {
            status: 'idle',
            progress: 0,
            message: '',
        };
        resultBlob.value = null;
        resultFileName.value = '';
    }

    function setResult(blob: Blob, fileName: string): void {
        resultBlob.value = blob;
        resultFileName.value = fileName;
    }

    function downloadResult(): void {
        if (resultBlob.value && resultFileName.value) {
            saveAs(resultBlob.value, resultFileName.value);
        }
    }

    return {
        state,
        startProcessing,
        updateProgress,
        finishProcessing,
        setError,
        reset,
        resultBlob,
        resultUrl,
        resultFileName,
        setResult,
        downloadResult,
    };
}
