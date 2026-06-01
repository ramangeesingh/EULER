import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, WrapText, AlignLeft } from 'lucide-react';

// ─── Simple line numbers ────────────────────────────────────────────────────
function LineNumbers({ code }) {
  const lines = code.split('\n');
  return (
    <div
      className="select-none text-right pr-4 pt-[14px] shrink-0"
      style={{
        width: '48px',
        color: 'rgba(107,114,128,0.5)',
        fontSize: '12px',
        lineHeight: '1.6',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        borderRight: '1px solid rgba(255,255,255,0.05)',
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {lines.map((_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

// ─── File tab button ────────────────────────────────────────────────────────
function FileTab({ id, label, ext, active, onClick, lineCount }) {
  const colors = { html: '#f97316', css: '#38bdf8', js: '#fcd34d' };
  const color = colors[id] || '#a78bfa';
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium transition-all shrink-0 relative"
      style={{
        color: active ? '#fff' : 'rgba(156,163,175,0.6)',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
        background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
      }}
    >
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
        style={{ background: `${color}20`, color }}
      >
        {ext}
      </span>
      {label}
      <span className="text-[10px] ml-1" style={{ color: 'rgba(107,114,128,0.5)' }}>
        {lineCount}L
      </span>
    </button>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function CodeEditorPanel({
  htmlCode, cssCode, jsCode,
  activeFile,
  onChangeHtml, onChangeCss, onChangeJs,
}) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  const currentCode = activeFile === 'html' ? htmlCode : activeFile === 'css' ? cssCode : jsCode;
  const onChange     = activeFile === 'html' ? onChangeHtml : activeFile === 'css' ? onChangeCss : onChangeJs;

  const FILE_TABS = [
    { id: 'html', label: 'index.html', ext: 'html', code: htmlCode },
    { id: 'css',  label: 'styles.css', ext: 'css',  code: cssCode  },
    { id: 'js',   label: 'script.js',  ext: 'js',   code: jsCode   },
  ];

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [currentCode]);

  const handleDownloadFile = useCallback(() => {
    const ext = activeFile;
    const filename = `${activeFile === 'html' ? 'index' : activeFile === 'css' ? 'styles' : 'script'}.${ext}`;
    const type = activeFile === 'html' ? 'text/html' : activeFile === 'css' ? 'text/css' : 'application/javascript';
    const blob = new Blob([currentCode], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentCode, activeFile]);

  const lineCount = currentCode ? currentCode.split('\n').length : 0;
  const charCount = currentCode ? currentCode.length : 0;

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d0d14' }}>
      {/* ── Toolbar ── */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)' }}
      >
        {/* File tabs */}
        <div className="flex items-end">
          {FILE_TABS.map(({ id, label, ext, code }) => (
            <FileTab
              key={id}
              id={id}
              label={label}
              ext={ext}
              active={activeFile === id}
              onClick={() => {
                // Tabs are controlled by parent via activeTab in BuildWebsitePage
                // We emit a synthetic click — parent already controls which tab is active
                // This panel is only rendered for html/css/js tabs
              }}
              lineCount={code ? code.split('\n').length : 0}
            />
          ))}
        </div>

        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-1.5 pr-3">
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className="p-1.5 rounded-lg transition-all"
            title="Toggle word wrap"
            style={{
              background: wordWrap ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: wordWrap ? '#c4b5fd' : 'rgba(107,114,128,0.7)',
            }}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <motion.button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
            style={{
              background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
              color: copied ? '#4ade80' : 'rgba(156,163,175,0.7)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
            }}
            whileTap={{ scale: 0.96 }}
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>
      </div>

      {/* ── Editor area ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* Line numbers */}
        <LineNumbers code={currentCode} />

        {/* Textarea */}
        <textarea
          value={currentCode}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none outline-none sidebar-scroll"
          style={{
            background: 'transparent',
            color: '#e5e7eb',
            fontSize: '13px',
            lineHeight: '1.6',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            padding: '14px 16px',
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            overflowX: wordWrap ? 'hidden' : 'auto',
            overflowY: 'auto',
            border: 'none',
            caretColor: '#a78bfa',
          }}
        />
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex items-center gap-4 px-4 py-1.5 flex-shrink-0 text-[11px]"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.3)',
          color: 'rgba(107,114,128,0.6)',
        }}
      >
        <span>Lines: {lineCount.toLocaleString()}</span>
        <span>Characters: {charCount.toLocaleString()}</span>
        <div className="flex-1" />
        <span style={{ color: 'rgba(124,58,237,0.6)' }}>
          {activeFile === 'html' ? 'HTML' : activeFile === 'css' ? 'CSS' : 'JavaScript'}
        </span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
