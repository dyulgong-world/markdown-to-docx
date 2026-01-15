import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  content: string;
  visible: boolean;
}

const Preview: React.FC<PreviewProps> = ({ content, visible }) => {
  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Document Preview
      </div>
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-blue-600 prose-table:border-collapse prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-td:border bg-white shadow-sm p-8 min-h-full rounded-lg border border-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Preview;