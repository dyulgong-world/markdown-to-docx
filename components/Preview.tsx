import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocxStyleConfig } from '../types';

interface PreviewProps {
  content: string;
  visible: boolean;
  styleConfig?: DocxStyleConfig;
}

const Preview: React.FC<PreviewProps> = ({ content, visible, styleConfig }) => {
  if (!visible) return null;

  // Generate dynamic CSS based on user configuration
  // Using !important to override Tailwind Typography defaults where necessary
  const dynamicStyles = useMemo(() => {
    if (!styleConfig) return null;
    const { typography, codeBlock, inlineCode, table, blockquote, font, list, thematicBreak, sizes } = styleConfig;

    return (
      <style>{`
        /* Fonts */
        .custom-preview h1, .custom-preview h2, .custom-preview h3, .custom-preview h4, .custom-preview h5, .custom-preview h6 { 
          font-family: '${font.heading}', sans-serif !important; 
        }
        .custom-preview p, .custom-preview li, .custom-preview td, .custom-preview span, .custom-preview div { 
          font-family: '${font.body}', sans-serif !important; 
          font-size: ${sizes.body}pt !important;
        }
        .custom-preview code, .custom-preview pre {
          font-family: '${font.code}', monospace !important;
          font-size: ${sizes.code}pt !important;
        }

        /* Font Sizes for Headings */
        .custom-preview h1 { font-size: ${sizes.heading1}pt !important; }
        .custom-preview h2 { font-size: ${sizes.heading2}pt !important; }
        .custom-preview h3 { font-size: ${sizes.heading3}pt !important; }
        .custom-preview h4 { font-size: ${sizes.heading4}pt !important; }
        .custom-preview h5 { font-size: ${sizes.heading5}pt !important; }
        .custom-preview h6 { font-size: ${sizes.heading6}pt !important; }

        /* Typography Colors */
        .custom-preview h1 { color: ${typography.heading1} !important; }
        .custom-preview h2 { color: ${typography.heading2} !important; }
        .custom-preview h3 { color: ${typography.heading3} !important; }
        .custom-preview h4 { color: ${typography.heading4} !important; }
        .custom-preview h5 { color: ${typography.heading5} !important; }
        .custom-preview h6 { color: ${typography.heading6} !important; }
        
        .custom-preview p, .custom-preview li, .custom-preview td { color: ${typography.body} !important; }
        .custom-preview a { color: ${typography.link} !important; }

        /* Lists */
        .custom-preview ul > li::marker { color: ${list.markerColor} !important; }
        .custom-preview ol > li::marker { color: ${list.markerColor} !important; }

        /* Horizontal Rule */
        .custom-preview hr { border-color: ${thematicBreak.color} !important; }

        /* Code Blocks */
        .custom-preview pre { 
          background-color: ${codeBlock.background} !important; 
        }
        .custom-preview pre code {
           color: ${codeBlock.text} !important;
           background-color: transparent !important;
        }

        /* Inline Code */
        .custom-preview :not(pre) > code {
          background-color: ${inlineCode.background} !important;
          color: ${inlineCode.color} !important;
          padding: 0.2em 0.4em !important;
          border-radius: 0.25rem !important;
        }

        /* Tables */
        .custom-preview th { 
          background-color: ${table.headerBackground} !important; 
          color: ${table.headerText} !important; 
          border-color: ${table.borderColor} !important;
        }
        .custom-preview td {
          border-color: ${table.borderColor} !important;
        }

        /* Blockquotes */
        .custom-preview blockquote { 
          background-color: ${blockquote.background} !important; 
          border-left-color: ${blockquote.border} !important;
          color: ${blockquote.textColor} !important;
        }
        .custom-preview blockquote p {
           color: inherit !important;
        }
      `}</style>
    );
  }, [styleConfig]);

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {dynamicStyles}
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Document Preview
      </div>
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="custom-preview prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-blue-600 prose-table:border-collapse prose-th:p-2 prose-td:p-2 prose-td:border bg-white shadow-sm p-8 min-h-full rounded-lg border border-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Preview;