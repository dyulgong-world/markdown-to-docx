import React from 'react';
import { Download, Layout, Columns, Eye, FileText } from 'lucide-react';
import { ViewMode } from '../types';

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onDownload: () => void;
  hasContent: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  viewMode, 
  setViewMode, 
  onDownload, 
  hasContent
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">Markdown to Docx Pro</h1>
          <p className="text-xs text-slate-500">Structured Document Exporter</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* View Toggles */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode(ViewMode.EDITOR)}
            className={`p-2 rounded-md transition-all ${viewMode === ViewMode.EDITOR ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Editor Only"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode(ViewMode.SPLIT)}
            className={`p-2 rounded-md transition-all ${viewMode === ViewMode.SPLIT ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Split View"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode(ViewMode.PREVIEW)}
            className={`p-2 rounded-md transition-all ${viewMode === ViewMode.PREVIEW ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Preview Only"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Export Action */}
        <button
          onClick={onDownload}
          disabled={!hasContent}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
            ${!hasContent 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'}`}
        >
          <Download className="w-4 h-4" />
          Download .docx
        </button>
      </div>
    </header>
  );
};

export default Toolbar;