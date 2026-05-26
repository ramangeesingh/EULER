import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

/** Pulsing dot indicator while Euler is thinking/streaming */
function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 ml-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-purple-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

/**
 * Very lightweight markdown-ish renderer:
 *  - Wraps ```...``` blocks in <pre><code>
 *  - Wraps `inline` code in <code>
 *  - Wraps **bold** text
 *  - Preserves newlines
 */
function renderContent(text) {
  if (!text) return null;

  // Split by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Fenced code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const newlineIdx = inner.indexOf('\n');
      const lang = newlineIdx > -1 ? inner.slice(0, newlineIdx).trim() : '';
      const code = newlineIdx > -1 ? inner.slice(newlineIdx + 1) : inner;

      return (
        <div key={i} className="my-3 rounded-xl overflow-hidden" style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {lang && (
            <div className="px-4 py-1.5 text-[11px] text-gray-400 font-mono uppercase tracking-wider"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {lang}
            </div>
          )}
          <pre className="px-4 py-3 overflow-x-auto text-[13px] leading-6 text-gray-200 font-mono">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    // Inline formatting
    return (
      <span key={i}>
        {part.split('\n').map((line, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {line.split(/(`[^`]+`)/g).map((seg, si) => {
              if (seg.startsWith('`') && seg.endsWith('`')) {
                return (
                  <code key={si} className="px-1.5 py-0.5 rounded-md text-[13px] font-mono text-purple-200"
                    style={{ background: 'rgba(124,58,237,0.2)' }}>
                    {seg.slice(1, -1)}
                  </code>
                );
              }
              // Bold
              return seg.split(/(\*\*[^*]+\*\*)/g).map((boldSeg, bi) => {
                if (boldSeg.startsWith('**') && boldSeg.endsWith('**')) {
                  return <strong key={`${si}-${bi}`} className="font-semibold text-white">{boldSeg.slice(2, -2)}</strong>;
                }
                return <span key={`${si}-${bi}`}>{boldSeg}</span>;
              });
            })}
          </span>
        ))}
      </span>
    );
  });
}

export default function MessageList({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div
      className="max-w-4xl mx-auto px-6 py-10 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.3) }}
            className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-end mb-1"
              style={{
                background: isUser
                  ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' // User avatar
                  : 'rgba(124,58,237,0.18)', // AI avatar
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: isUser ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              {isUser ? (
                <User className="w-[15px] h-[15px] text-white" />
              ) : (
                <Sparkles className="w-[15px] h-[15px] text-purple-400" />
              )}
            </div>

            {/* Chat Bubble */}
            <div
              className={`max-w-[75%] px-5 py-3.5 ${
                isUser
                  ? 'rounded-[20px] rounded-br-sm'
                  : 'rounded-[20px] rounded-bl-sm'
              }`}
              style={{
                background: isUser
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' // Purple gradient for user
                  : 'rgba(20,20,30,0.85)', // Dark glass for AI
                border: isUser
                  ? '1px solid rgba(255,255,255,0.15)'
                  : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                boxShadow: isUser
                  ? '0 8px 24px rgba(109,40,217,0.25)'
                  : '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {!isUser && (
                <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 opacity-80">
                  Euler AI
                </div>
              )}

              <div
                className={`text-[15px] leading-relaxed break-words ${
                  isUser ? 'text-white' : 'text-gray-200'
                }`}
              >
                {isUser ? (
                  msg.content
                ) : (
                  <>
                    {msg.content ? renderContent(msg.content) : null}
                    {msg.isStreaming && <StreamingIndicator />}
                  </>
                )}
              </div>

              {msg.isError && (
                <div className="text-[12px] text-red-300 mt-2 p-2 bg-red-900/40 rounded-md border border-red-500/20">
                  Something went wrong. Try sending your message again.
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      <div ref={endRef} className="h-4" />
    </motion.div>
  );
}
