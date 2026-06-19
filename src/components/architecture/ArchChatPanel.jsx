import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Square } from 'lucide-react';
import { AIErrorBanner } from '../shared/AIErrorState';
import { EulerLoader } from '../shared/EulerLogo';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../shared/UserAvatar';

const STARTER_QUESTIONS = [
  'How should I handle file uploads at scale?',
  'What caching strategy should I use?',
  'How do I set up WebSocket support?',
  'Explain the microservices communication pattern',
  'How can I improve the security posture?',
];

function MessageBubble({ msg, user }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Avatar */}
      {isUser ? (
        <UserAvatar user={user} size={28} style={{ alignSelf: 'flex-start', marginTop: '2px' }} />
      ) : (
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Bot className="w-3.5 h-3.5 text-blue-400" />
        </div>
      )}

      {/* Bubble */}
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed"
        style={isUser ? {
          background: 'linear-gradient(135deg, rgba(37, 99, 235,0.25), rgba(59, 130, 246,0.2))',
          border: '1px solid rgba(37, 99, 235,0.3)',
          color: '#e9d5ff',
          borderRadius: '18px 18px 4px 18px',
        } : {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: '#d1d5db',
          borderRadius: '18px 18px 18px 4px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.content}
        {msg.isStreaming && (
          <span
            className="inline-block w-1.5 h-4 ml-0.5 rounded-sm align-middle"
            style={{ background: '#60A5FA', animation: 'pulse 1s infinite' }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function ArchChatPanel({ architecture }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const lastInputRef = useRef('');
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAbort = () => {
    console.log('[CHAT] Stop requested');
    abortRef.current?.();
    abortRef.current = null;
    // Mark the last streaming message as done
    setMessages((curr) => {
      const copy = [...curr];
      if (copy[copy.length - 1]?.role === 'assistant') {
        copy[copy.length - 1] = { ...copy[copy.length - 1], isStreaming: false };
      }
      return copy;
    });
    setIsStreaming(false);
  };

  const sendMessage = async (text, retrying = false) => {
    if (!text.trim() || isStreaming) return;
    console.log('[CHAT] Generation started');
    lastInputRef.current = text;
    const userMsg = { role: 'user', content: text.trim() };
    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };

    if (!retrying) {
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    } else {
      // Replace last assistant msg for retry
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = assistantMsg;
        return copy;
      });
    }
    setStreamError(false);
    if (retrying) setIsRetrying(true);
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const res = await fetch('/api/architecture/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          architectureContext: architecture,
        }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
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
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((curr) => {
                const copy = [...curr];
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
      if (err.name === 'AbortError') {
        console.log('[CHAT] Stream aborted');
        console.log('[CHAT] Generation cancelled successfully');
      } else {
        setStreamError(true);
        // Remove the empty streaming assistant message
        setMessages((curr) => {
          const copy = [...curr];
          if (copy[copy.length - 1]?.role === 'assistant' && !copy[copy.length - 1].content) {
            copy.pop();
          }
          return copy;
        });
      }
    } finally {
      setMessages((curr) => {
        const copy = [...curr];
        if (copy[copy.length - 1]?.role === 'assistant') {
          copy[copy.length - 1] = { ...copy[copy.length - 1], isStreaming: false };
        }
        return copy;
      });
      setIsStreaming(false);
      setIsRetrying(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleRetry = () => sendMessage(lastInputRef.current, true);

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-5 space-y-4">
        {messages.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center h-full pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235,0.3), rgba(59, 130, 246,0.2))',
                border: '1px solid rgba(37, 99, 235,0.3)',
              }}
            >
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Refine Your Architecture</h3>
            <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
              Ask questions, request changes, or explore specific sections of your architecture.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[12px] px-3 py-1.5 rounded-xl text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} user={user} />)}
        </AnimatePresence>
        {/* Error banner with retry */}
        <AnimatePresence>
          {streamError && (
            <AIErrorBanner
              onRetry={handleRetry}
              onDismiss={() => setStreamError(false)}
              isRetrying={isRetrying}
            />
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your architecture... (Enter to send, Shift+Enter for newline)"
            className="flex-1 bg-transparent resize-none text-[13px] text-white placeholder-gray-600 outline-none"
            style={{ minHeight: '20px', maxHeight: '120px' }}
            rows={1}
            disabled={isStreaming}
          />
          <AnimatePresence mode="wait" initial={false}>
            {isStreaming ? (
              <motion.button
                key="stop"
                onClick={handleAbort}
                title="Stop generating"
                className="p-2 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  boxShadow: '0 0 12px rgba(239,68,68,0.15)',
                }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.18 }}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
              >
                <Square className="w-4 h-4 text-red-400 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                key="send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                title="Send message"
                className="p-2 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: input.trim()
                    ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                    : 'rgba(255,255,255,0.06)',
                  opacity: input.trim() ? 1 : 0.4,
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.18 }}
                whileHover={input.trim() ? { scale: 1.05 } : {}}
                whileTap={input.trim() ? { scale: 0.95 } : {}}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
