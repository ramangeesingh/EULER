import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const STARTER_QUESTIONS = [
  'How should I handle file uploads at scale?',
  'What caching strategy should I use?',
  'How do I set up WebSocket support?',
  'Explain the microservices communication pattern',
  'How can I improve the security posture?',
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
            : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-purple-400" />
        }
      </div>

      {/* Bubble */}
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed"
        style={isUser ? {
          background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.2))',
          border: '1px solid rgba(124,58,237,0.3)',
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
            style={{ background: '#a78bfa', animation: 'pulse 1s infinite' }}
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
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isStreaming) return;
    const userMsg = { role: 'user', content: text.trim() };
    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
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
      if (err.name !== 'AbortError') {
        setMessages((curr) => {
          const copy = [...curr];
          copy[copy.length - 1] = { role: 'assistant', content: '⚠️ Failed to get response. Please try again.' };
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
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

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
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
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
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
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
          <motion.button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="p-2 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: input.trim() && !isStreaming
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'rgba(255,255,255,0.06)',
              opacity: input.trim() && !isStreaming ? 1 : 0.4,
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            }}
            whileHover={input.trim() && !isStreaming ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isStreaming ? { scale: 0.95 } : {}}
          >
            {isStreaming
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </motion.button>
        </div>
      </div>
    </div>
  );
}
