import React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, visible }) => {
  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Markdown Input
      </div>
      <textarea
        className="flex-1 w-full p-6 resize-none focus:outline-none custom-scrollbar font-mono text-sm leading-relaxed text-slate-800"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# 제목을 입력하세요..."
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;