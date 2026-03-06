<script setup lang="ts">
import { ref } from 'vue';
import { trans } from 'laravel-vue-i18n';

interface Props {
    accept: string;
    multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    multiple: false,
});

const emit = defineEmits<{
    'files-selected': [files: File[]];
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function openFileBrowser() {
    fileInput.value?.click();
}

function onFileInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        emit('files-selected', Array.from(target.files));
    }
    // Reset input so the same file can be selected again
    target.value = '';
}

function onDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging.value = true;
}

function onDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging.value = true;
}

function onDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
}

function onDrop(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;

    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) {
        return;
    }

    const droppedFiles = Array.from(event.dataTransfer.files);

    // Filter files by accepted extensions if specified
    const acceptedExtensions = props.accept
        .split(',')
        .map((ext) => ext.trim().toLowerCase());

    const validFiles = droppedFiles.filter((file) => {
        const fileName = file.name.toLowerCase();
        return acceptedExtensions.some((ext) => fileName.endsWith(ext));
    });

    if (validFiles.length > 0) {
        emit('files-selected', props.multiple ? validFiles : [validFiles[0]]);
    }
}
</script>

<template>
    <div
        class="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 transition-all duration-200"
        :class="[
            isDragging
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
        ]"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="openFileBrowser"
    >
        <input
            ref="fileInput"
            type="file"
            class="hidden"
            :accept="accept"
            :multiple="multiple"
            @change="onFileInputChange"
            @click.stop
        />

        <!-- Upload cloud icon -->
        <div class="mb-4">
            <svg
                class="h-16 w-16 transition-colors duration-200"
                :class="isDragging ? 'text-red-400' : 'text-gray-400'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
            </svg>
        </div>

        <!-- Title -->
        <h3 class="mb-1 text-lg font-semibold text-gray-700">
            {{ trans('tool.upload_title') }}
        </h3>

        <!-- Description -->
        <p class="mb-4 text-sm text-gray-500">
            {{ trans('tool.upload_description') }}
        </p>

        <!-- Browse button -->
        <button
            type="button"
            class="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            @click.stop="openFileBrowser"
        >
            {{ trans('tool.upload_button') }}
        </button>
    </div>
</template>
