import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { UploadedFile } from '@/types';

/** Maximum file size in bytes (200 MB). */
const MAX_FILE_SIZE = 200 * 1024 * 1024;

export function useFileHandler(accept: string, multiple: boolean) {
    const files: Ref<UploadedFile[]> = ref([]);
    const rejectedFiles: Ref<string[]> = ref([]);

    const hasFiles: ComputedRef<boolean> = computed(() => files.value.length > 0);

    function addFiles(fileList: File[]): void {
        const accepted: File[] = [];
        const rejected: string[] = [];

        for (const file of fileList) {
            if (file.size > MAX_FILE_SIZE) {
                rejected.push(file.name);
            } else {
                accepted.push(file);
            }
        }

        rejectedFiles.value = rejected;

        if (accepted.length === 0) return;

        const newFiles: UploadedFile[] = accepted.map((file) => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
        }));

        if (multiple) {
            files.value = [...files.value, ...newFiles];
        } else {
            files.value = [newFiles[0]];
        }
    }

    function removeFile(id: string): void {
        const file = files.value.find((f) => f.id === id);
        if (file?.preview) {
            URL.revokeObjectURL(file.preview);
        }
        files.value = files.value.filter((f) => f.id !== id);
    }

    function moveFile(fromIndex: number, toIndex: number): void {
        const arr = [...files.value];
        const [item] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, item);
        files.value = arr;
    }

    function removeAll(): void {
        files.value.forEach((file) => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        files.value = [];
    }

    return {
        files,
        addFiles,
        removeFile,
        moveFile,
        removeAll,
        hasFiles,
        rejectedFiles,
    };
}
