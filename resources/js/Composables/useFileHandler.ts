import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { UploadedFile } from '@/types';

export function useFileHandler(accept: string, multiple: boolean) {
    const files: Ref<UploadedFile[]> = ref([]);

    const hasFiles: ComputedRef<boolean> = computed(() => files.value.length > 0);

    function addFiles(fileList: File[]): void {
        const newFiles: UploadedFile[] = fileList.map((file) => ({
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
        removeAll,
        hasFiles,
    };
}
