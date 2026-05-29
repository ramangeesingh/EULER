import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';

export default function RepoChatPanel({ files, analysis }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I have full context of this repository. Ask me anything about the code — I can explain functions, suggest improvements, find bugs, trace data flow, and more.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  // Build repo context string (cap at 60k chars)
  const buildContext = useCallback(() => {
    let ctx = '';
    const MAX = 60000;
    for (const [path, content] of Object.entries(files || {})) {
      const snippet = `\n\n=== ${path} ===\n${content.slice(0, 4000)}`;
      if (ctx.length + snippet.length > MAX) break;
      ctx += snippet;
    }
    return ctx;
  }, [files]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = { role: 'user', content: input.trim() };
    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const res = await fetch('/api/repo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          repoContext: buildContext(),
          analysis,
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
          if (!line.trim().startsWith('data: ')) continue;
          const data = line.trim().slice(6);
          if (data === '[DONE]') break;
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
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: '⚠️ Error connecting to AI.', isError: true };
          return copy;
        });
      }
    } finally {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.role === 'assistant') {
          copy[copy.length - 1] = { ...copy[copy.length - 1], isStreaming: false };
        }
        return copy;
      });
      setIsStreaming(false);
      abortRef.current = null;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [input, isStreaming, messages, analysis, buildContext]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Bot className="w-4 h-4 text-purple-400" />
        <span className="text-[13px] font-semibold text-gray-300">Repo Chat</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full ml-auto"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          Context Loaded
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: msg.role === 'assistant'
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              {msg.role === 'assistant'
                ? <Bot className="w-3.5 h-3.5 text-white" />
                : <User className="w-3.5 h-3.5 text-gray-400" />
              }
            </div>
            <div
              className="rounded-xl px-4 py-3 max-w-[85%]"
              style={{
                background: msg.role === 'user'
                  ? 'rgba(124,58,237,0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <p className="text-[13px] text-gray-200 whitespace-pre-wrap leading-relaxed">
                {msg.content}
                {msg.isStreaming && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="inline-block w-1.5 h-3.5 bg-purple-400 ml-0.5 rounded-sm"
                  />
                )}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about the repo..."
            rows={1}
            className="flex-1 bg-transparent resize-none text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none leading-6"
            style={{ maxHeight: '80px' }}
          />
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
              opacity: !input.trim() || isStreaming ? 0.5 : 1,
            }}
            whileHover={input.trim() ? { scale: 1.05 } : {}}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
