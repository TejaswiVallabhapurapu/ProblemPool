import React, { useState } from 'react';

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
 * Text-only formatting buttons and Write/Preview tab switcher
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
    <div className="border-b border-white/10 bg-white/5 px-3 py-2 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl">
      {/* Format Action Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => insertSnippet('**', '**', 'bold text')}
          className="px-2 py-1 rounded text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="Bold (**text**)"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('*', '*', 'italic text')}
          className="px-2 py-1 rounded text-xs italic text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="Italic (*text*)"
        >
          I
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('### ', '', 'Heading text')}
          className="px-2 py-1 rounded text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="Heading (### Title)"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('> ', '', 'Quoted text')}
          className="px-2 py-1 rounded text-xs font-serif text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="Quote (> Quote)"
        >
          Quote
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('- ', '', 'List item')}
          className="px-2 py-1 rounded text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="List item (- Item)"
        >
          List
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('[', '](https://example.com)', 'Link Title')}
          className="px-2 py-1 rounded text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="Hyperlink ([Text](url))"
        >
          Link
        </button>

        <button
          type="button"
          onClick={() => insertSnippet('`', '`', 'inline_code()')}
          className="px-2 py-1 rounded text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition cursor-pointer"
          title="Inline Code (`code`)"
        >
          Code
        </button>

        {/* Code Block Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCodeDropdown(!showCodeDropdown)}
            className="px-2 py-1 rounded text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10 transition cursor-pointer"
            title="Insert syntax-highlighted code block"
          >
            Code Block
          </button>

          {showCodeDropdown && (
            <div className="absolute left-0 top-full mt-1 w-40 bg-[#181818] rounded-xl shadow-xl border border-white/10 py-1.5 z-30 max-h-48 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Select Language
              </div>
              {CODE_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => insertCodeBlock(lang.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition font-medium cursor-pointer"
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
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => onTabChange('write')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              activeTab === 'write'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => onTabChange('preview')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkdownToolbar;
