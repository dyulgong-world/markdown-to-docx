import React, { useState, useEffect } from 'react';
import { DocxStyleConfig, DEFAULT_STYLE_CONFIG } from '../types';
import { X, RotateCcw, Download } from 'lucide-react';

interface StyleSettingsProps {
  config: DocxStyleConfig;
  onChange: (config: DocxStyleConfig) => void;
  onClose: () => void;
  isOpen: boolean;
}

const DEFAULT_FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Merriweather",
  "Playfair Display",
  "Arial",
  "Calibri",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Consolas",
  "Courier New",
  "Monaco"
];

const StyleSettings: React.FC<StyleSettingsProps> = ({ config, onChange, onClose, isOpen }) => {
  const [fontOptions, setFontOptions] = useState<string[]>(DEFAULT_FONT_OPTIONS);
  const [isLocalFontsSupported, setIsLocalFontsSupported] = useState(false);
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);

  useEffect(() => {
    // Check if the browser supports the Local Font Access API
    if (typeof window !== 'undefined' && 'queryLocalFonts' in window) {
      setIsLocalFontsSupported(true);
    }
  }, []);

  const handleLoadLocalFonts = async () => {
    setIsLoadingFonts(true);
    try {
      // @ts-ignore - queryLocalFonts is experimental
      const localFonts = await window.queryLocalFonts();
      const uniqueFamilies = new Set<string>(DEFAULT_FONT_OPTIONS);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localFonts.forEach((font: any) => {
        uniqueFamilies.add(font.family);
      });

      setFontOptions(Array.from(uniqueFamilies).sort());
    } catch (error) {
      console.error("Error loading local fonts:", error);
    } finally {
      setIsLoadingFonts(false);
    }
  };

  if (!isOpen) return null;

  // Generic handler for nested objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (section: keyof DocxStyleConfig, key: string, value: any) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_STYLE_CONFIG);
  };

  return (
    <div className="absolute top-16 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col max-h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50 rounded-t-lg">
        <div>
          <h3 className="font-bold text-slate-800">Export Settings</h3>
          <p className="text-[10px] text-slate-500">Customize appearance for DOCX</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
        {/* Fonts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
              Fonts
            </h4>
            {isLocalFontsSupported && (
              <button 
                onClick={handleLoadLocalFonts}
                disabled={isLoadingFonts}
                className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                {isLoadingFonts ? '...' : 'System Fonts'}
              </button>
            )}
          </div>
          <div className="grid gap-3 pl-3 border-l-2 border-slate-100">
            <SelectInput 
              label="Headings" 
              value={config.font.heading} 
              options={fontOptions}
              onChange={(v) => handleChange('font', 'heading', v)} 
            />
            <SelectInput 
              label="Body Text" 
              value={config.font.body} 
              options={fontOptions}
              onChange={(v) => handleChange('font', 'body', v)} 
            />
            <SelectInput 
              label="Code / Mono" 
              value={config.font.code} 
              options={fontOptions}
              onChange={(v) => handleChange('font', 'code', v)} 
            />
          </div>
        </section>

        {/* Font Sizes */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
            Font Sizes (pt)
          </h4>
          <div className="grid grid-cols-3 gap-3 pl-3 border-l-2 border-slate-100">
             <NumberInput label="Body" value={config.sizes.body} onChange={(v) => handleChange('sizes', 'body', v)} />
             <NumberInput label="Code" value={config.sizes.code} onChange={(v) => handleChange('sizes', 'code', v)} />
             <div className="col-span-1"></div> {/* Spacer */}
             
             <NumberInput label="H1" value={config.sizes.heading1} onChange={(v) => handleChange('sizes', 'heading1', v)} />
             <NumberInput label="H2" value={config.sizes.heading2} onChange={(v) => handleChange('sizes', 'heading2', v)} />
             <NumberInput label="H3" value={config.sizes.heading3} onChange={(v) => handleChange('sizes', 'heading3', v)} />
             <NumberInput label="H4" value={config.sizes.heading4} onChange={(v) => handleChange('sizes', 'heading4', v)} />
             <NumberInput label="H5" value={config.sizes.heading5} onChange={(v) => handleChange('sizes', 'heading5', v)} />
             <NumberInput label="H6" value={config.sizes.heading6} onChange={(v) => handleChange('sizes', 'heading6', v)} />
          </div>
        </section>

        {/* Headings Colors */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
            Headings Colors
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-3 border-l-2 border-slate-100">
            <ColorInput label="H1" value={config.typography.heading1} onChange={(v) => handleChange('typography', 'heading1', v)} />
            <ColorInput label="H2" value={config.typography.heading2} onChange={(v) => handleChange('typography', 'heading2', v)} />
            <ColorInput label="H3" value={config.typography.heading3} onChange={(v) => handleChange('typography', 'heading3', v)} />
            <ColorInput label="H4" value={config.typography.heading4} onChange={(v) => handleChange('typography', 'heading4', v)} />
            <ColorInput label="H5" value={config.typography.heading5} onChange={(v) => handleChange('typography', 'heading5', v)} />
            <ColorInput label="H6" value={config.typography.heading6} onChange={(v) => handleChange('typography', 'heading6', v)} />
          </div>
        </section>

        {/* Body & Links */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
            Text & Links
          </h4>
          <div className="grid gap-3 pl-3 border-l-2 border-slate-100">
            <ColorInput 
              label="Body Text" 
              value={config.typography.body} 
              onChange={(v) => handleChange('typography', 'body', v)} 
            />
            <ColorInput 
              label="Links" 
              value={config.typography.link} 
              onChange={(v) => handleChange('typography', 'link', v)} 
            />
             <ColorInput 
              label="Lists Markers" 
              value={config.list.markerColor} 
              onChange={(v) => handleChange('list', 'markerColor', v)} 
            />
             <ColorInput 
              label="Horizontal Rule" 
              value={config.thematicBreak.color} 
              onChange={(v) => handleChange('thematicBreak', 'color', v)} 
            />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
            Code Styling
          </h4>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100">
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Block Code</div>
            <div className="grid gap-2">
              <ColorInput label="Background" value={config.codeBlock.background} onChange={(v) => handleChange('codeBlock', 'background', v)} />
              <ColorInput label="Text" value={config.codeBlock.text} onChange={(v) => handleChange('codeBlock', 'text', v)} />
            </div>
            
            <div className="text-[10px] font-semibold text-slate-400 uppercase mt-3 mb-1">Inline Code</div>
            <div className="grid gap-2">
               <ColorInput label="Background" value={config.inlineCode.background} onChange={(v) => handleChange('inlineCode', 'background', v)} />
               <ColorInput label="Text" value={config.inlineCode.color} onChange={(v) => handleChange('inlineCode', 'color', v)} />
            </div>
          </div>
        </section>

        {/* Components */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
            Tables & Quotes
          </h4>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100">
             <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Tables</div>
             <div className="grid gap-2">
              <ColorInput label="Header Bg" value={config.table.headerBackground} onChange={(v) => handleChange('table', 'headerBackground', v)} />
              <ColorInput label="Header Text" value={config.table.headerText} onChange={(v) => handleChange('table', 'headerText', v)} />
              <ColorInput label="Borders" value={config.table.borderColor} onChange={(v) => handleChange('table', 'borderColor', v)} />
             </div>

             <div className="text-[10px] font-semibold text-slate-400 uppercase mt-3 mb-1">Blockquotes</div>
             <div className="grid gap-2">
              <ColorInput label="Background" value={config.blockquote.background} onChange={(v) => handleChange('blockquote', 'background', v)} />
              <ColorInput label="Text" value={config.blockquote.textColor} onChange={(v) => handleChange('blockquote', 'textColor', v)} />
              <ColorInput label="Border" value={config.blockquote.border} onChange={(v) => handleChange('blockquote', 'border', v)} />
             </div>
          </div>
        </section>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-lg flex justify-between items-center flex-shrink-0">
        <button 
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-md hover:bg-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

const ColorInput: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between group">
    <label className="text-xs text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{label}</label>
    <div className="flex items-center gap-2">
      <div 
        className="h-6 w-6 rounded-full shadow-sm border border-slate-200 cursor-pointer overflow-hidden relative"
        style={{ backgroundColor: value }}
      >
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  </div>
);

const NumberInput: React.FC<{ label: string; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-600 font-medium">{label}</label>
    <div className="relative">
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
        min="1"
        max="100"
      />
      <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">pt</span>
    </div>
  </div>
);

const SelectInput: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-600 font-medium">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default StyleSettings;