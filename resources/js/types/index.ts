export interface ToolDefinition {
    slug: string;
    icon: string;
    color: string;
    bgColor: string;
    accepts: string;
    multiple: boolean;
}

export interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview?: string;
    pageCount?: number;
}

export interface ProcessingState {
    status: 'idle' | 'processing' | 'done' | 'error';
    progress: number;
    message: string;
}