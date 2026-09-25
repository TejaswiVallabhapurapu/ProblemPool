import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

// Load Prism Theme
import 'prismjs/themes/prism-tomorrow.css';

// Load Prism Language Grammars
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';

import { Copy, Check, Code as CodeIcon, Terminal } from 'lucide-react';

// Language display aliases & styling
const LANGUAGE_META = {
  java: { label: 'Java', badge: 'bg-orange-950/70 text-orange-300 border-orange-800/60' },
  python: { label: 'Python', badge: 'bg-blue-950/70 text-blue-300 border-blue-800/60' },
  javascript: { label: 'JavaScript', badge: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/60' },
  js: { label: 'JavaScript', badge: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/60' },
  typescript: { label: 'TypeScript', badge: 'bg-sky-950/70 text-sky-300 border-sky-800/60' },
  ts: { label: 'TypeScript', badge: 'bg-sky-950/70 text-sky-300 border-sky-800/60' },
  c: { label: 'C', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
  cpp: { label: 'C++', badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60' },
  'c++': { label: 'C++', badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60' },
  sql: { label: 'SQL', badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60' },
  html: { label: 'HTML', badge: 'bg-rose-950/70 text-rose-300 border-rose-800/60' },
  css: { label: 'CSS', badge: 'bg-purple-950/70 text-purple-300 border-purple-800/60' },
  json: { label: 'JSON', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60' },
  bash: { label: 'Bash', badge: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  sh: { label: 'Shell', badge: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  shell: { label: 'Shell', badge: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  go: { label: 'Go', badge: 'bg-teal-950/70 text-teal-300 border-teal-800/60' },
  rust: { label: 'Rust', badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60' },
};

/**
 * Enhanced CodeBlock Component with Syntax Highlighting, Header, and Copy Button
 */
const CodeBlock = ({ language, codeString }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || '').toLowerCase().trim();
  const meta = LANGUAGE_META[cleanLang] || {
    label: cleanLang ? cleanLang.toUpperCase() : 'CODE',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeString);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = codeString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  // Syntax highlight with Prism
  let highlightedHtml = '';
  try {
    const prismLang =
      cleanLang === 'js'
        ? 'javascript'
        : cleanLang === 'ts'
        ? 'typescript'
        : cleanLang === 'c++'
        ? 'cpp'
        : cleanLang === 'sh' || cleanLang === 'shell'
        ? 'bash'
        : cleanLang;

    if (prismLang && Prism.languages[prismLang]) {
      highlightedHtml = Prism.highlight(codeString, Prism.languages[prismLang], prismLang);
    } else {
      highlightedHtml = Prism.highlight(codeString, Prism.languages.javascript || Prism.languages.markup, 'markup');
    }
  } catch (e) {
    highlightedHtml = '';
  }

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-lg text-slate-100 max-w-full">
      {/* Code Block Top Header */}
      <div className="px-4 py-2.5 bg-[#1e293b] border-b border-slate-800/90 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-400 font-mono font-medium">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badge}`}
            >
              {meta.label}
            </span>
          </span>
        </div>

        {/* Copy Code Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
          }`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Pre Container */}
      <div className="p-4 overflow-x-auto font-mono text-[13px] leading-relaxed select-text no-scrollbar">
        {highlightedHtml ? (
          <pre className="m-0 p-0 bg-transparent">
            <code
              className={`language-${cleanLang} block`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="m-0 p-0 bg-transparent text-slate-200">
            <code className="block whitespace-pre">{codeString}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

/**
 * MarkdownRenderer component
 * Safely renders markdown content, rich text elements, and syntax-highlighted code blocks.
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  return (
    <div className={`markdown-content text-slate-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom Code Renderer (Block vs Inline)
          code({ node, inline, className: codeClass, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClass || '');
            const rawCode = String(children).replace(/\n$/, '');

            if (!inline && (match || rawCode.includes('\n'))) {
              return (
                <CodeBlock
                  language={match ? match[1] : ''}
                  codeString={rawCode}
                />
              );
            }

            // Inline Code
            return (
              <code
                className="bg-slate-100 text-indigo-700 font-mono text-[12.5px] px-1.5 py-0.5 rounded-md border border-slate-200 font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Safe Link Renderer
          a({ node, href, children, ...props }) {
            const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
            // Filter unsafe javascript: schemes
            const safeHref = href && !href.trim().toLowerCase().startsWith('javascript:') ? href : '#';

            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-5 mb-2.5 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1.5">
                {children}
              </h4>
            );
          },

          // Paragraphs
          p({ children }) {
            return <p className="leading-relaxed mb-3 text-sm sm:text-base text-slate-700">{children}</p>;
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 px-4 py-2.5 my-3.5 rounded-r-2xl text-slate-700 italic text-sm">
                {children}
              </blockquote>
            );
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-outside pl-5 my-3 space-y-1 text-sm sm:text-base text-slate-700">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside pl-5 my-3 space-y-1 text-sm sm:text-base text-slate-700">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-slate-100/80 font-bold text-slate-800">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-slate-50/60 transition">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 text-left font-semibold text-slate-900">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3.5 py-2.5 text-slate-700">{children}</td>;
          },

          // Horizontal Rule
          hr() {
            return <hr className="my-6 border-slate-200" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
