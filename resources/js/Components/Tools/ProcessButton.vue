<script setup lang="ts">
import { trans } from 'laravel-vue-i18n';

interface Props {
    status: 'idle' | 'processing' | 'done' | 'error';
    progress?: number;
    label: string;
    color?: string;
}

const props = withDefaults(defineProps<Props>(), {
    progress: 0,
    color: 'bg-red-500',
});

const emit = defineEmits<{
    process: [];
}>();

/** Extract the hover variant from a bg color class, e.g. bg-red-500 -> hover:bg-red-600 */
function hoverColor(bg: string): string {
    const match = bg.match(/^bg-(\w+)-(\d+)$/);
    if (!match) return 'hover:bg-red-600';
    const shade = Math.min(Number(match[2]) + 100, 900);
    return `hover:bg-${match[1]}-${shade}`;
}
</script>

<template>
    <div class="space-y-3">
        <!-- Main button -->
        <button
            type="button"
            class="relative w-full overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            :class="[
                status === 'error' ? 'bg-red-500' : color,
                status === 'idle' ? hoverColor(color) : '',
            ]"
            :disabled="status === 'processing'"
            @click="emit('process')"
        >
            <!-- Idle state -->
            <span v-if="status === 'idle'" class="flex items-center justify-center gap-2">
                {{ label }}
            </span>

            <!-- Processing state -->
            <span
                v-else-if="status === 'processing'"
                class="flex flex-col items-center justify-center gap-2"
            >
                <span class="flex items-center gap-2">
                    <svg
                        class="h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    {{ trans('tool.processing') }} {{ Math.round(progress) }}%
                </span>

                <!-- Progress bar -->
                <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                    <div
                        class="h-full rounded-full bg-white transition-all duration-300 ease-out"
                        :style="{ width: `${progress}%` }"
                    />
                </div>
            </span>

            <!-- Done state -->
            <span v-else-if="status === 'done'" class="flex items-center justify-center gap-2">
                <svg
                    class="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                    />
                </svg>
                {{ trans('tool.done') }}
            </span>

            <!-- Error state -->
            <span v-else-if="status === 'error'" class="flex items-center justify-center gap-2">
                <svg
                    class="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                </svg>
                {{ trans('tool.retry') }}
            </span>
        </button>

        <!-- Error message -->
        <p v-if="status === 'error'" class="text-center text-sm text-red-500">
            {{ trans('tool.error_occurred') }}
        </p>
    </div>
</template>
