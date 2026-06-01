import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Square, Code2, X, ChevronDown, ChevronUp,
  Loader2, Zap, Bug, Wrench, Sparkles, MessageSquare,
} from 'lucide-react';

// ─── Action mode definitions ─────────────────────────────────────────────────
const MODES = [
  { id: 'general', label: 'Chat',    icon: MessageSquare, color: '#9ca3af', desc: 'General dev conversation' },
  { id: 'explain', label: 'Explain', icon: Zap,           color: '#67e8f9', desc: 'Explain code / concepts' },
  { id: 'debug',   label: 'Debug',   icon: Bug,           color: '#fca5a5', desc: 'Debug errors & bugs' },
  { id: 'fix',     label: 'Fix',     icon: Wrench,        color: '#86efac', desc: 'Generate a fix' },
  { id: 'improve', label: 'Improve', icon: Sparkles,      color: '#fcd34d', desc: 'Review & improve code' },
];

// ─── Code context attachment panel ──────────────────────────────────────────
function CodeContextPanel({ value, onChange, onClose }) {
  return (
    <motion.div
      className="mx-4 mb-0 rounded-t-xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[12px] font-medium text-gray-400">Code Context</span>
          <span className="text-[11px] text-gray-600">— AI will reference this code</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-600 hover:text-gray-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your code here..."
        rows={6}
        className="w-full resize-none outline-none text-[12.5px] sidebar-scroll"
        style={{
          background: 'transparent',
          color: '#d1d5db',
          padding: '10px 14px',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: '1.55',
          border: 'none',
        }}
      />
    </motion.div>
  );
}

// ─── Mode selector ───────────────────────────────────────────────────────────
function ModeSelector({ activeMode, onSelect, open, onToggle }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: MODES.find(m => m.id === activeMode)?.color || '#9ca3af',
        }}
      >
        {(() => {
          const m = MODES.find(m => m.id === activeMode);
          const Icon = m?.icon;
          return (
            <>
              {Icon && <Icon className="w-3 h-3" />}
              <span>{m?.label}</span>
              {open ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
            </>
          );
        })()}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full mb-1.5 left-0 rounded-xl overflow-hidden z-20"
            style={{
              background: 'rgba(10,10,18,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              minWidth: '200px',
            }}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {MODES.map(({ id, label, icon: Icon, color, desc }) => (
              <button
                key={id}
                onClick={() => { onSelect(id); onToggle(); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all hover:bg-white/[0.04]"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: activeMode === id ? '#fff' : '#d1d5db' }}>
                    {label}
                  </div>
                  <div className="text-[11px] text-gray-600">{desc}</div>
                </div>
                {activeMode === id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main input component ────────────────────────────────────────────────────
export default function DevInput({
  onSend, isStreaming, onAbort,
  codeContext, onCodeContextChange,
}) {
  const [text, setText]               = useState('');
  const [mode, setMode]               = useState('general');
  const [modeOpen, setModeOpen]       = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const textareaRef                   = useRef(null);

  const activeMode = MODES.find(m => m.id === mode);
  const hasCode    = codeContext.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!text.trim() || isStreaming) return;
    onSend({ text: text.trim(), mode, code: codeContext });
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, mode, codeContext, isStreaming, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const handleCloseCodePanel = () => {
    setShowCodePanel(false);
    onCodeContextChange('');
  };

  const charCount = text.length;
  const isNearLimit = charCount > 3500;

  return (
    <div
      className="flex-shrink-0"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Code context panel */}
      <AnimatePresence>
        {showCodePanel && (
          <CodeContextPanel
            value={codeContext}
            onChange={onCodeContextChange}
            onClose={handleCloseCodePanel}
          />
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="px-4 pt-3 pb-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${isStreaming ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.09)'}`,
            boxShadow: isStreaming ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          {/* Code context indicator strip */}
          {hasCode && !showCodePanel && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => setShowCodePanel(true)}
            >
              <Code2 className="w-3 h-3 text-purple-400" />
              <span className="text-[11.5px] text-gray-500">
                Code context attached ({codeContext.split('\n').length} lines)
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseCodePanel(); }}
                className="ml-auto text-gray-600 hover:text-gray-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              mode === 'debug'   ? 'Paste your error message or stack trace...' :
              mode === 'explain' ? 'What would you like explained?' :
              mode === 'fix'     ? 'Describe the issue or paste broken code...' :
              mode === 'improve' ? 'What should I improve?' :
              'Ask anything about your code...'
            }
            rows={1}
            className="w-full resize-none outline-none text-[14px] text-white placeholder-gray-600 sidebar-scroll"
            style={{
              background: 'transparent',
              padding: '12px 14px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.55',
              maxHeight: '160px',
              overflowY: 'auto',
              border: 'none',
            }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center gap-2 px-3 pb-2.5 pt-1">
            {/* Mode selector */}
            <ModeSelector
              activeMode={mode}
              onSelect={setMode}
              open={modeOpen}
              onToggle={() => setModeOpen(!modeOpen)}
            />

            {/* Code context button */}
            <button
              onClick={() => setShowCodePanel(!showCodePanel)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all"
              style={{
                background: hasCode ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${hasCode ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: hasCode ? '#a78bfa' : '#6b7280',
              }}
              title="Attach code context"
            >
              <Code2 className="w-3 h-3" />
              {hasCode ? 'Code attached' : 'Add code'}
            </button>

            {/* Char count */}
            {charCount > 100 && (
              <span
                className="text-[11px] ml-1"
                style={{ color: isNearLimit ? '#f87171' : '#4b5563' }}
              >
                {charCount.toLocaleString()}
              </span>
            )}

            <div className="flex-1" />

            {/* Hint */}
            <span className="text-[11px] text-gray-700 hidden sm:block">
              Enter to send · Shift+Enter for newline
            </span>

            {/* Send / Stop */}
            {isStreaming ? (
              <motion.button
                onClick={onAbort}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSend}
                disabled={!text.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: text.trim()
                    ? `linear-gradient(135deg, ${activeMode?.color || '#7c3aed'}60, rgba(79,70,229,0.5))`
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${text.trim() ? (activeMode?.color || '#7c3aed') + '50' : 'rgba(255,255,255,0.07)'}`,
                  color: text.trim() ? '#fff' : '#374151',
                  boxShadow: text.trim() ? `0 4px 16px ${activeMode?.color || '#7c3aed'}30` : 'none',
                }}
                whileHover={text.trim() ? { scale: 1.06 } : {}}
                whileTap={text.trim() ? { scale: 0.94 } : {}}
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
