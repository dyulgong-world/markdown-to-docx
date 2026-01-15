export enum ViewMode {
  SPLIT = 'SPLIT',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}

export interface MarkdownElement {
  type: 'paragraph' | 'heading' | 'list' | 'code';
  level?: number; // For headings (1-6)
  content: string;
  ordered?: boolean; // For lists
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}