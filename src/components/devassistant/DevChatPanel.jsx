import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import DevMessageBubble from './DevMessageBubble';
import DevInput from './DevInput';

// ─── Suggested starter prompts ──────────────────────────────────────────────
const STARTERS = [
  { icon: '🔍', label: 'Explain this code', prompt: 'Can you explain what this code does and how it works?' },
  { icon: '🐛', label: 'Debug an error', prompt: 'I have a bug. Here is the error:\n\n' },
  { icon: '✨', label: 'Improve my code', prompt: 'Review this code and suggest improvements for performance, readability, and best practices:\n\n' },
  { icon: '🔧', label: 'Generate a fix', prompt: 'Fix this code:\n\n' },
  { icon: '📖', label: 'Best practices', prompt: 'What are the best practices for ' },
  { icon: '🏗️', label: 'Design pattern', prompt: 'What design pattern should I use for ' },
];

// ─── Thinking animation ─────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235,0.25), rgba(59, 130, 246,0.18))',
          border: '1px solid rgba(37, 99, 235,0.35)',
        }}
      >
        <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
      </div>

      {/* Dots */}
      <div
        className="px-4 py-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTopLeftRadius: '6px',
        }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#2563EB' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state (starters) ─────────────────────────────────────────────────
function StarterPrompts({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-4">
      <motion.div
        className="text-center mb-7"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[14px] text-gray-400 font-medium">What would you like to work on?</p>
        <p className="text-[12px] text-gray-600 mt-1">Choose a prompt below or type your own</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
        {STARTERS.map(({ icon, label, prompt }, i) => (
          <motion.button
            key={label}
            onClick={() => onSelect(prompt)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            whileHover={{
              background: 'rgba(37, 99, 235,0.08)',
              borderColor: 'rgba(37, 99, 235,0.3)',
              x: 2,
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-[13px] text-gray-300">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main chat panel ─────────────────────────────────────────────────────────
export default function DevChatPanel({ conversation, onUpdateMessages }) {
  const [messages, setMessages]       = useState(conversation?.messages || []);
  const [isStreaming, setIsStreaming]  = useState(false);
  const [codeContext, setCodeContext] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef                = useRef(null);
  const abortRef                      = useRef(null);
  const prevIdRef                     = useRef(conversation?.id);

  // When a different conversation is selected, sync messages
  useEffect(() => {
    if (prevIdRef.current !== conversation?.id) {
      prevIdRef.current = conversation?.id;
      setMessages(conversation?.messages || []);
      setIsStreaming(false);
      setSuggestions([]);
      abortRef.current?.();
    }
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Persist messages upward
  useEffect(() => {
    if (!conversation?.id) return;
    const title = messages[0]?.content?.slice(0, 55) || 'New conversation';
    onUpdateMessages(messages, title);
  }, [messages]);

  // ── Send message ───────────────────────────────────────────
  const handleSend = useCallback(async ({ text, mode, code }) => {
    if (!text.trim() || isStreaming) return;

    const ctx = code || codeContext;
    const userMsg = { role: 'user', content: text, timestamp: Date.now(), mode };
    const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };

    const updated = [...messages, userMsg, assistantMsg];
    setMessages(updated);
    setIsStreaming(true);
    setSuggestions([]);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const res = await fetch('/api/devassistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          mode,
          codeContext: ctx,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

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
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: `⚠️ Error: ${err.message}`, isError: true };
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
  }, [messages, isStreaming, codeContext]);

  // ── Starter prompt selected ────────────────────────────────
  const handleStarterSelect = (prompt) => {
    // Pre-fill the input — send directly
    handleSend({ text: prompt, mode: 'general', code: '' });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-6 py-6 space-y-5">
        {isEmpty ? (
          <StarterPrompts onSelect={handleStarterSelect} />
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <DevMessageBubble key={i} message={msg} />
              ))}
            </AnimatePresence>

            {isStreaming && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.content === '' && (
              <ThinkingIndicator />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0">
        <DevInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onAbort={() => abortRef.current?.()}
          codeContext={codeContext}
          onCodeContextChange={setCodeContext}
        />
      </div>
    </div>
  );
}
