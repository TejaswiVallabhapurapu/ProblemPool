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

// Language display aliases & styling
const LANGUAGE_META = {
  java: { label: 'Java' },
  python: { label: 'Python' },
  javascript: { label: 'JavaScript' },
  js: { label: 'JavaScript' },
  typescript: { label: 'TypeScript' },
  ts: { label: 'TypeScript' },
  c: { label: 'C' },
  cpp: { label: 'C++' },
  'c++': { label: 'C++' },
  sql: { label: 'SQL' },
  html: { label: 'HTML' },
  css: { label: 'CSS' },
  json: { label: 'JSON' },
  bash: { label: 'Bash' },
  sh: { label: 'Shell' },
  shell: { label: 'Shell' },
  go: { label: 'Go' },
  rust: { label: 'Rust' },
};

/**
 * Enhanced CodeBlock Component with Syntax Highlighting, Header, and Copy Button (Text-Only)
 */
const CodeBlock = ({ language, codeString }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || '').toLowerCase().trim();
  const meta = LANGUAGE_META[cleanLang] || {
    label: cleanLang ? cleanLang.toUpperCase() : 'CODE',
  };

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeString);
      } else {
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
    <div className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c0c] shadow-lg text-neutral-100 max-w-full">
      {/* Code Block Top Header */}
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-white/10 text-neutral-200 border border-white/10">
            {meta.label}
          </span>
        </div>

        {/* Copy Code Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-mono font-semibold transition-all duration-150 cursor-pointer ${
            copied
              ? 'bg-white text-black font-bold'
              : 'bg-white/10 text-neutral-200 hover:text-white hover:bg-white/20 border border-white/15'
          }`}
          title="Copy code to clipboard"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code Pre Container */}
      <div className="p-4 overflow-x-auto font-mono text-sm sm:text-[14.5px] leading-relaxed select-text no-scrollbar">
        {highlightedHtml ? (
          <pre className="m-0 p-0 bg-transparent">
            <code
              className={`language-${cleanLang} block`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="m-0 p-0 bg-transparent text-neutral-200">
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
    <div className={`markdown-content text-neutral-200 ${className}`}>
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
                className="bg-white/10 text-white font-mono text-sm px-2 py-0.5 rounded border border-white/10 font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Safe Link Renderer
          a({ node, href, children, ...props }) {
            const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
            const safeHref = href && !href.trim().toLowerCase().startsWith('javascript:') ? href : '#';

            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-white underline font-semibold hover:text-neutral-300 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-7 mb-3.5 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-6 mb-3 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-base sm:text-lg font-bold text-white mt-4 mb-2">
                {children}
              </h4>
            );
          },

          // Paragraphs
          p({ children }) {
            return <p className="leading-relaxed mb-4 text-base sm:text-[16px] text-neutral-200">{children}</p>;
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-white/40 bg-white/5 px-4 py-3 my-4 rounded-r-xl text-neutral-200 italic text-base">
                {children}
              </blockquote>
            );
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-outside pl-6 my-3.5 space-y-1.5 text-base sm:text-[16px] text-neutral-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside pl-6 my-3.5 space-y-1.5 text-base sm:text-[16px] text-neutral-200">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-5 rounded-xl border border-white/10 shadow-xs">
                <table className="min-w-full divide-y divide-white/10 text-sm sm:text-base">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-white/5 font-bold text-white">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-white/5 bg-[#121212]/80">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-white/5 transition">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-4 py-3 text-left font-bold text-white">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-3 text-neutral-200">{children}</td>;
          },

          // Horizontal Rule
          hr() {
            return <hr className="my-6 border-white/10" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
