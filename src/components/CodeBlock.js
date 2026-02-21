// components/CodeBlock.js - Reduced width, scrollable inside

import { useState, useEffect } from 'react';
import { Check, Copy, File, FileJson, FileCode, Terminal, Braces, Globe } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const getFileIcon = (language) => {
  switch (language) {
    case 'javascript':
    case 'js':
    case 'jsx':
      return <FileJson size={16} className="text-yellow-400" />;
    case 'typescript':
    case 'ts':
    case 'tsx':
      return <FileCode size={16} className="text-blue-400" />;
    case 'python':
    case 'py':
      return <Terminal size={16} className="text-green-400" />;
    case 'html':
      return <Globe size={16} className="text-orange-400" />;
    case 'css':
      return <Braces size={16} className="text-purple-400" />;
    case 'json':
      return <FileJson size={16} className="text-yellow-400" />;
    default:
      return <File size={16} className="text-gray-400" />;
  }
};

const getLanguageName = (lang) => {
  const map = {
    js: 'JavaScript', jsx: 'JavaScript React',
    ts: 'TypeScript', tsx: 'TypeScript React',
    py: 'Python', rb: 'Ruby', java: 'Java',
    go: 'Go', rs: 'Rust', php: 'PHP',
    html: 'HTML', css: 'CSS', scss: 'SCSS',
    json: 'JSON', md: 'Markdown', sql: 'SQL',
    sh: 'Shell', bash: 'Bash',
  };
  return map[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
};

const blackTheme = {
  ...atomDark,
  'pre[class*="language-"]': {
    ...atomDark['pre[class*="language-"]'],
    background: '#000000',
    backgroundColor: '#000000',
  },
  'code[class*="language-"]': {
    ...atomDark['code[class*="language-"]'],
    background: '#000000',
    backgroundColor: '#000000',
  },
};

export default function CodeBlock({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;
  const langDisplay = getLanguageName(language);
  const fileIcon = getFileIcon(language);

  return (
    <div
      style={{
        // ✅ Fixed max width — tweak this value to fit your chat bubble
        width: '100%',
        maxWidth: '700px',        // ← adjust this to your chat bubble width
        minWidth: 0,
        overflow: 'hidden',       // hard clip
        borderRadius: '0.75rem',
        border: '1px solid #1a1a1a',
        margin: '0.75rem 0',
        boxSizing: 'border-box',
        display: 'block',
      }}
    >
      {/* ── Title Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #1f1f1f',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* MacOS dots */}
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
          </div>

          {/* Language info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ flexShrink: 0 }}>{fileIcon}</span>
            <span style={{
              fontSize: '11px', color: '#d1d5db', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {langDisplay}
            </span>
            <span style={{ fontSize: '10px', color: '#6b7280', flexShrink: 0 }}>
              {lineCount} lines
            </span>
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 7px', fontSize: '10px',
            backgroundColor: '#0e639c', color: '#fff',
            border: 'none', borderRadius: '4px',
            cursor: 'pointer', flexShrink: 0, marginLeft: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1177bb')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0e639c')}
        >
          {copied
            ? <><Check size={11} /><span>Copied!</span></>
            : <><Copy size={11} /><span>Copy</span></>}
        </button>
      </div>

      {/* ── Scroll Wrapper ── */}
      <div
        className="cb-scroll"
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: '#000000',
          boxSizing: 'border-box',
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={blackTheme}
          showLineNumbers={true}
          wrapLines={false}
          wrapLongLines={false}
          lineNumberStyle={{
            color: '#3a3a3a',
            fontSize: '0.7rem',
            paddingRight: '0.6rem',
            minWidth: '1.8rem',
            textAlign: 'right',
            backgroundColor: '#000000',
            userSelect: 'none',
          }}
          customStyle={{
            margin: 0,
            padding: '0.6rem 0.4rem',
            background: '#000000',
            backgroundColor: '#000000',
            fontSize: '0.72rem',    // ✅ slightly smaller font = less width
            lineHeight: '1.55',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
            whiteSpace: 'pre',
            overflowX: 'visible',
            overflowY: 'visible',
            tabSize: 2,
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
              fontSize: '0.72rem',
              whiteSpace: 'pre',
              background: '#000000',
              fontFeatureSettings: '"liga" 1, "calt" 1',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* ── Status Bar ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          padding: '3px 10px', fontSize: '9px',
          backgroundColor: '#007acc', color: '#ffffff',
          width: '100%', boxSizing: 'border-box', gap: '8px',
        }}
      >
        <span>{langDisplay}</span>
        <span>Ln {lineCount}</span>
        <span>UTF-8</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: '#c4b5fd', display: 'inline-block',
          }} />
          Dark (Black)
        </span>
      </div>

      <style jsx>{`
        .cb-scroll::-webkit-scrollbar { height: 3px; }
        .cb-scroll::-webkit-scrollbar-track { background: #000; }
        .cb-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 999px; }
        .cb-scroll::-webkit-scrollbar-thumb:hover { background: #555; }

        :global(pre[class*='language-']) {
          overflow: visible !important;
          background: #000 !important;
          background-color: #000 !important;
          white-space: pre !important;
        }
        :global(code[class*='language-']) {
          white-space: pre !important;
          background: #000 !important;
        }
        :global(.token) {
          display: inline !important;
          white-space: pre !important;
        }
        :global(pre, code, .token) {
          font-family: 'JetBrains Mono', Consolas, Monaco, monospace !important;
          font-feature-settings: 'liga' 1, 'calt' 1;
        }
      `}</style>
    </div>
  );
}
