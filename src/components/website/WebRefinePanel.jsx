import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Loader2, Wand2, Copy, CheckCircle,
  Sparkles, CornerDownLeft,
} from 'lucide-react';

// ─── Suggestion chips ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Make the hero section bigger and more dramatic',
  'Add a pricing section with 3 tiers',
  'Change the color scheme to cyan and dark blue',
  'Add smooth scroll animations to all sections',
  'Make it more minimal and clean',
  'Add a testimonials section with avatar cards',
  'Make the navigation sticky with blur backdrop',
  'Add a footer with links and social icons',
];

// ─── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Simple render: detect code blocks
  const renderContent = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const lang = lines[0].slice(3).trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        return (
          <div
            key={i}
            className="relative my-3 rounded-xl overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}
            >
              <span className="text-[11px] uppercase tracking-wider text-gray-500">{lang}</span>
              <button
                onClick={() => handleCopy(code)}
                className="flex items-center gap-1 text-[11px] transition-colors"
                style={{ color: copied ? '#4ade80' : 'rgba(107,114,128,0.7)' }}
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre
              className="p-4 overflow-x-auto sidebar-scroll text-[12px] leading-relaxed"
              style={{
                color: '#e5e7eb',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            >
              {code}
            </pre>
          </div>
        );
      }
      // Regular text with line breaks
      return part.split('\n').map((line, j) => (
        <p key={`${i}-${j}`} className={`text-[13.5px] leading-relaxed ${line === '' ? 'h-2' : ''}`} style={{ color: isUser ? '#f3f4f6' : '#d1d5db' }}>
          {line}
        </p>
      ));
    });
  };

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5"
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #2563EB, #3B82F6)', color: '#fff' }
            : { background: 'rgba(37, 99, 235,0.15)', border: '1px solid rgba(37, 99, 235,0.3)' }
        }
      >
        {isUser ? 'U' : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[82%] px-4 py-3 rounded-2xl"
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, rgba(37, 99, 235,0.25), rgba(59, 130, 246,0.18))',
                border: '1px solid rgba(37, 99, 235,0.3)',
                borderTopRightRadius: '6px',
              }
            : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTopLeftRadius: '6px',
              }
        }
      >
        <div>{renderContent(message.content)}</div>
        {message.isStreaming && (
          <span
            className="inline-block w-1 h-4 ml-1 rounded-full"
            style={{ background: '#60A5FA', animation: 'pulse 1s ease-in-out infinite', verticalAlign: 'middle' }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export default function WebRefinePanel({ currentCode, siteTitle, onApplyCode }) {
  const [messages, setMessages]     = useState([
    {
      role: 'assistant',
      content: `Hi! I'm Euler, your AI design partner. I can help you refine and improve "${siteTitle || 'your website'}". 

Tell me what you'd like to change — add sections, adjust colors, modify layouts, or improve any aspect of the design.`,
    },
  ]);
  const [input, setInput]           = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef              = useRef(null);
  const abortRef                    = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;
    setInput('');
    setShowSuggestions(false);

    const userMsg = { role: 'user', content: msg };
    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const res = await fetch('/api/website/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          currentCode,
          siteTitle,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: '⚠️ Error: ' + err.message, isError: true };
          }
          return copy;
        });
      }
    } finally {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, isStreaming: false };
        }
        return copy;
      });
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, currentCode, siteTitle]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0,0,0,0.2)' }}>
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
        >
          <Wand2 className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[13px] font-semibold text-white">AI Refine</span>
        <span className="text-[11px] text-gray-600 ml-1">Iterate on your design with AI</span>
        <div className="flex-1" />
        {messages.length > 1 && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Suggestions
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-4 py-4 space-y-4">

        {/* Suggestion chips (shown initially) */}
        <AnimatePresence>
          {showSuggestions && messages.length <= 2 && (
            <motion.div
              className="pb-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-3">Quick refinements</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleSend(s)}
                    disabled={isStreaming}
                    className="px-3 py-1.5 rounded-full text-[12px] text-gray-300 hover:text-white transition-all"
                    style={{
                      background: 'rgba(37, 99, 235,0.08)',
                      border: '1px solid rgba(37, 99, 235,0.2)',
                    }}
                    whileHover={{ borderColor: 'rgba(37, 99, 235,0.45)', scale: 1.02 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a change... (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none outline-none bg-transparent text-[13.5px] text-white placeholder-gray-600 py-1.5 sidebar-scroll"
            style={{
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.5',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mb-0.5 transition-all"
            style={{
              background: input.trim() && !isStreaming
                ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: input.trim() && !isStreaming ? '0 4px 14px rgba(37, 99, 235,0.4)' : 'none',
            }}
            whileHover={input.trim() ? { scale: 1.06 } : {}}
            whileTap={input.trim() ? { scale: 0.94 } : {}}
          >
            {isStreaming
              ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />
            }
          </motion.button>
        </div>
        <p className="text-[10.5px] text-gray-600 mt-1.5 flex items-center gap-1">
          <CornerDownLeft className="w-2.5 h-2.5" />
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
