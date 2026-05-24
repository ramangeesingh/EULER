import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Plus, Upload, Globe, Code, Network } from 'lucide-react';
import { useState } from 'react';

export default function MessageInput({ onSendMessage }) {
  const [input, setInput] = useState('');
  const [showActions, setShowActions] = useState(true);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const actions = [
    { icon: Upload, label: 'Upload Repository', color: 'from-purple-500 to-pink-500', angle: -58 },
    { icon: Globe, label: 'Build Website', color: 'from-blue-500 to-cyan-500', angle: -23 },
    { icon: Code, label: 'Analyze Code', color: 'from-green-500 to-emerald-500', angle: 21 },
    { icon: Network, label: 'Generate Architecture', color: 'from-orange-500 to-red-500', angle: 52 },
  ];

  return (
    <div className="relative px-8 pb-[31px]">
      <div className="max-w-[870px] mx-auto -translate-x-[36px]">
        {/* Rainbow Arc Menu */}
        <AnimatePresence>
          {showActions && (
            <div className="absolute bottom-[73px] left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative w-[650px] h-[245px]"
              >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 650 245">
                  <defs>
                    <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="20%" stopColor="#3b82f6" />
                      <stop offset="48%" stopColor="#22c55e" />
                      <stop offset="73%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 46 232 Q 325 20 604 232"
                    fill="none"
                    stroke="url(#rainbow)"
                    strokeWidth="4"
                    opacity="0.95"
                  />
                </svg>

                {actions.map((action, i) => {
                  const radius = 183;
                  const centerX = 325;
                  const centerY = 233;
                  const angleRad = (action.angle * Math.PI) / 180;
                  const x = centerX + radius * Math.sin(angleRad);
                  const y = centerY - radius * Math.cos(angleRad);

                  return (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: 20 }}
                      transition={{
                        delay: i * 0.05,
                        duration: 0.4,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      className="absolute group"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <motion.button
                        onClick={() => setShowActions(false)}
                        className="w-[74px] h-[74px] rounded-full bg-[#12131d]/90 border border-white/15 flex items-center justify-center shadow-2xl relative backdrop-blur-xl"
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <action.icon className="w-8 h-8 text-white relative z-10" />
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${action.color} blur-xl opacity-20`} />
                      </motion.button>

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full mb-[15px] left-1/2 -translate-x-1/2 whitespace-nowrap"
                      >
                        <div className="glass px-4 py-3 rounded-lg text-[13px] font-medium text-white shadow-lg">
                          {action.label}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Input Box */}
        <div className="h-[104px] glass cosmic-glow input-glow rounded-[38px] pl-5 pr-[18px] flex items-center gap-[22px]">
          {/* Action Button */}
          <motion.button
            onClick={() => setShowActions(!showActions)}
            className={`w-16 h-16 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
              showActions
                ? 'bg-gradient-to-br from-violet-700 to-indigo-950 text-white shadow-[0_0_35px_rgba(139,92,246,0.45)]'
                : 'hover:bg-white/10 text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className={`w-9 h-9 transition-transform ${showActions ? 'rotate-45' : ''}`} />
          </motion.button>

          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Euler anything..."
            rows={1}
            className="flex-1 bg-transparent resize-none focus:outline-none py-3 px-0 max-h-32 text-gray-200 placeholder-gray-500 text-[18px]"
            style={{ minHeight: '52px' }}
          />

          {/* Voice Button */}
          <motion.button
            className="w-16 h-16 rounded-full bg-white/[0.04] hover:bg-white/[0.07] transition-all flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic className="w-7 h-7 text-white" />
          </motion.button>

          {/* Send Button */}
          <motion.button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-16 h-16 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
              input.trim()
                ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_0_34px_rgba(124,58,237,0.65)]'
            }`}
            whileHover={input.trim() ? { scale: 1.05 } : {}}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-7 h-7" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
