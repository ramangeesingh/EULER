import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function MessageList({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div
      className="max-w-3xl mx-auto px-6 py-10 space-y-7"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex gap-4"
        >
          {/* Avatar */}
          <div
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                msg.role === 'assistant'
                  ? 'rgba(124,58,237,0.18)'
                  : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {msg.role === 'assistant' ? (
              <Sparkles className="w-4 h-4 text-purple-400" />
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1.5">
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
              {msg.role === 'assistant' ? 'Euler' : 'You'}
            </div>
            <div className="text-[15px] text-gray-200 leading-relaxed">{msg.content}</div>
          </div>
        </motion.div>
      ))}
      <div ref={endRef} />
    </motion.div>
  );
}
