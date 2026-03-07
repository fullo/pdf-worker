<script setup lang="ts">
import { ref, watch } from 'vue';
import { PDFDocument } from 'pdf-lib';
import { trans } from '@/i18n';
import type { MetadataOptions } from '@/Services/pdf/editMetadata';

const props = defineProps<{
    pdfFile: File | null;
}>();

const loading = ref(false);
const metaTitle = ref('');
const metaAuthor = ref('');
const metaSubject = ref('');
const metaKeywords = ref('');
const metaCreator = ref('');
const metaProducer = ref('');
const creationDate = ref('');
const modificationDate = ref('');

watch(() => props.pdfFile, async (file) => {
    if (!file) return;
    loading.value = true;
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        metaTitle.value = pdfDoc.getTitle() ?? '';
        metaAuthor.value = pdfDoc.getAuthor() ?? '';
        metaSubject.value = pdfDoc.getSubject() ?? '';
        metaKeywords.value = pdfDoc.getKeywords() ?? '';
        metaCreator.value = pdfDoc.getCreator() ?? '';
        metaProducer.value = pdfDoc.getProducer() ?? '';

        const cd = pdfDoc.getCreationDate();
        creationDate.value = cd ? cd.toLocaleString() : '';
        const md = pdfDoc.getModificationDate();
        modificationDate.value = md ? md.toLocaleString() : '';
    } catch (err) {
        console.error('Failed to read PDF metadata:', err);
    } finally {
        loading.value = false;
    }
}, { immediate: true });

function getMetadataOptions(): MetadataOptions {
    return {
        title: metaTitle.value,
        author: metaAuthor.value,
        subject: metaSubject.value,
        keywords: metaKeywords.value
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0),
        creator: metaCreator.value,
        producer: metaProducer.value,
    };
}

defineExpose({ getMetadataOptions });
</script>

<template>
    <div class="space-y-4">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.metadata.action') }}</h3>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-8">
            <svg class="h-6 w-6 animate-spin text-cyan-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ trans('tool.metadata.loading') }}</span>
        </div>

        <!-- Metadata form -->
        <div v-else class="space-y-3">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.metadata.title_label') }}</label>
                <input v-model="metaTitle" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-cyan-500 focus:ring-cyan-500" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.metadata.author_label') }}</label>
                <input v-model="metaAuthor" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-cyan-500 focus:ring-cyan-500" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.metadata.subject_label') }}</label>
                <input v-model="metaSubject" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-cyan-500 focus:ring-cyan-500" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.metadata.keywords_label') }}</label>
                <input v-model="metaKeywords" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-cyan-500 focus:ring-cyan-500" />
                <p class="mt-1 text-xs text-gray-400">{{ trans('tool.metadata.keywords_hint') }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.metadata.creator_label') }}</label>
                <input v-model="metaCreator" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-cyan-500 focus:ring-cyan-500" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.metadata.producer_label') }}</label>
                <input v-model="metaProducer" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-cyan-500 focus:ring-cyan-500" />
            </div>

            <!-- Read-only dates -->
            <div v-if="creationDate || modificationDate" class="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{{ trans('tool.metadata.dates_info') }}</p>
                <div v-if="creationDate" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span class="font-medium">{{ trans('tool.metadata.creation_date') }}:</span>
                    <span>{{ creationDate }}</span>
                </div>
                <div v-if="modificationDate" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span class="font-medium">{{ trans('tool.metadata.modification_date') }}:</span>
                    <span>{{ modificationDate }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
