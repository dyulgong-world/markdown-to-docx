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

export interface DocxStyleConfig {
  font: {
    heading: string;
    body: string;
    code: string; 
  };
  sizes: { // New: Font sizes in points (pt)
    heading1: number;
    heading2: number;
    heading3: number;
    heading4: number;
    heading5: number;
    heading6: number;
    body: number;
    code: number;
    tableHeader: number;
    tableBody: number;
  };
  typography: {
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
    heading5: string;
    heading6: string;
    body: string;
    link: string;
  };
  codeBlock: {
    background: string;
    text: string;
  };
  inlineCode: {
    color: string;
    background: string;
  };
  list: {
    markerColor: string;
  };
  table: {
    headerBackground: string;
    headerText: string;
    borderColor: string;
    boldHeader: boolean;
  };
  blockquote: {
    background: string;
    border: string;
    textColor: string;
  };
  thematicBreak: {
    color: string;
  };
}

export const DEFAULT_STYLE_CONFIG: DocxStyleConfig = {
  font: {
    heading: "Inter",
    body: "Inter",
    code: "Consolas"
  },
  sizes: {
    heading1: 28,
    heading2: 22,
    heading3: 18,
    heading4: 16,
    heading5: 14,
    heading6: 12,
    body: 11,
    code: 10,
    tableHeader: 11,
    tableBody: 11
  },
  typography: {
    heading1: "#0F172A", // Slate 900
    heading2: "#1E293B", // Slate 800
    heading3: "#334155", // Slate 700
    heading4: "#334155", // Slate 700
    heading5: "#475569", // Slate 600
    heading6: "#475569", // Slate 600
    body: "#334155",     // Slate 700
    link: "#2563EB"      // Blue 600
  },
  codeBlock: {
    background: "#1E293B", // Slate 800
    text: "#F8FAFC"        // Slate 50
  },
  inlineCode: {
    color: "#D946EF",      // Fuchsia 500
    background: "#F1F5F9"  // Slate 100
  },
  list: {
    markerColor: "#334155" // Slate 700
  },
  table: {
    headerBackground: "#F1F5F9", // Slate 100
    headerText: "#1E293B",       // Slate 800
    borderColor: "#CBD5E1",      // Slate 300
    boldHeader: true
  },
  blockquote: {
    background: "#EFF6FF", // Blue 50
    border: "#3B82F6",     // Blue 500
    textColor: "#1E40AF"   // Blue 800
  },
  thematicBreak: {
    color: "#CBD5E1"       // Slate 300
  }
};