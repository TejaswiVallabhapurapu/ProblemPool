import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Heading,
  List,
  Quote,
  Link as LinkIcon,
  Code,
  FileCode,
  Eye,
  Edit3,
  ChevronDown,
} from 'lucide-react';

const CODE_LANGUAGES = [
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'sql', label: 'SQL' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
];

/**
 * MarkdownToolbar Component
 * Provides quick format insertion and Write/Preview tab switcher
 */
const MarkdownToolbar = ({
  value,
  onChange,
  activeTab = 'write',
  onTabChange,
  placeholder = 'Write your problem or answer details...',
}) => {
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);

  const insertSnippet = (prefix, suffix = '', defaultText = '') => {
    const current = value || '';
    const newText = `${current}\n${prefix}${defaultText}${suffix}\n`;
    onChange(newText);
  };

  const insertCodeBlock = (lang) => {
    const snippet = `\`\`\`${lang}\n// Write your ${lang} code here\n\n\`\`\``;
    insertSnippet(snippet);
    setShowCodeDropdown(false);
  };

  return (
    <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl">
      {/* Format Action Buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => insertSnippet('**', '**', 'bold text')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('*', '*', 'italic text')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="Italic (*text*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('### ', '', 'Heading text')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="Heading (### Title)"
        >
          <Heading className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('> ', '', 'Quoted text')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="Quote (> Quote)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('- ', '', 'List item')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="List item (- Item)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('[', '](https://example.com)', 'Link Title')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="Hyperlink ([Text](url))"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('`', '`', 'inline_code()')}
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          title="Inline Code (`code`)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        {/* Code Block Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCodeDropdown(!showCodeDropdown)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-white border border-slate-200 transition cursor-pointer"
            title="Insert syntax-highlighted code block"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-500" />
            <span>Code Block</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCodeDropdown && (
            <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Language
              </div>
              {CODE_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => insertCodeBlock(lang.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition font-medium cursor-pointer"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Write / Live Preview Switcher */}
      {onTabChange && (
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onTabChange('write')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
              activeTab === 'write'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('preview')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkdownToolbar;
