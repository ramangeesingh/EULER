import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function MessageList({ messages }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div
      className="max-w-4xl mx-auto px-8 py-12 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {messages.map((message, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex gap-4"
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            message.role === 'assistant' ? 'bg-purple-500/20' : 'bg-white/10'
          }`}>
            {message.role === 'assistant' ? (
              <Sparkles className="w-5 h-5 text-purple-400" />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium text-gray-400">
              {message.role === 'assistant' ? 'Euler' : 'You'}
            </div>
            <div className="text-gray-200 leading-relaxed">
              {message.content}
            </div>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </motion.div>
  );
}
