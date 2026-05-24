import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Plus, X, Upload, Globe, Code, Network } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Action items that fan out in a rainbow semicircle ABOVE the plus button.
 * Angles are measured from the negative-Y axis (straight up = 0°),
 * spreading left→right like a rainbow arc.
 *
 * The arc spans from about -80° (left) to +80° (right), giving a
 * natural half-circle rainbow shape centred on the + button.
 */
const ACTIONS = [
  { icon: Upload, label: 'Upload Repository', color: '#9333ea', angle: -72 },
  { icon: Globe,  label: 'Build Website',      color: '#3b82f6', angle: -24 },
  { icon: Code,   label: 'Analyze Code',       color: '#22c55e', angle: 24  },
  { icon: Network,label: 'Generate Architecture', color: '#f97316', angle: 72 },
];

/** Radius of the arc (px) — distance from plus-button centre to each action icon */
const RADIUS = 130;

export default function MessageInput({ onSendMessage }) {
  const [input, setInput]           = useState('');
  const [showActions, setShowActions] = useState(false);
  const plusRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close arc when clicking outside
  useEffect(() => {
    if (!showActions) return;
    const handler = (e) => {
      if (plusRef.current && !plusRef.current.closest('.arc-root').contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showActions]);

  return (
    <div className="relative px-6 pb-6">
      <div className="max-w-[820px] mx-auto relative">

        {/* ════════════════════════════════════════════════
            Rainbow arc — rendered relative to the input row
            so it appears centred exactly on the + button
        ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              key="arc"
              className="absolute arc-root"
              /* Align arc container bottom edge with the centre of the + button.
                 The + button is ~58px tall, centred in the 72px input bar.
                 Offset from left edge of input = padding-left (20px) + half button (29px) = 49px */
              style={{
                bottom: '36px',   /* half of input height (72px / 2) */
                left: '20px',
                width: 0,
                height: 0,
                zIndex: 50,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* SVG rainbow arc — drawn around the origin (0,0) which IS the plus button centre */}
              <svg
                style={{
                  position: 'absolute',
                  /* Centre the SVG on the plus-button origin */
                  left: `-${RADIUS + 20}px`,
                  bottom: `0px`,
                  width:  `${(RADIUS + 20) * 2}px`,
                  height: `${RADIUS + 30}px`,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#9333ea" />
                    <stop offset="33%"  stopColor="#3b82f6" />
                    <stop offset="60%"  stopColor="#22c55e" />
                    <stop offset="82%"  stopColor="#facc15" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                {/* Arc path: centred at (RADIUS+20, RADIUS+20) with the given radius */}
                {(() => {
                  const cx = RADIUS + 20;
                  const cy = RADIUS + 20;
                  const r  = RADIUS;
                  const startAngle = (-80 * Math.PI) / 180;
                  const endAngle   = ( 80 * Math.PI) / 180;
                  // SVG angles: 0 = right, +90 = down; we want 0 = up so subtract π/2
                  const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
                  const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
                  const x2 = cx + r * Math.cos(endAngle   - Math.PI / 2);
                  const y2 = cy + r * Math.sin(endAngle   - Math.PI / 2);
                  return (
                    <motion.path
                      d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                      fill="none"
                      stroke="url(#rainbowGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                  );
                })()}
              </svg>

              {/* Action icons placed along the arc */}
              {ACTIONS.map((action, i) => {
                const rad = (action.angle * Math.PI) / 180;
                /* x: positive angle → right; y: upward so negate sin */
                const x = RADIUS * Math.sin(rad);
                const y = -RADIUS * Math.cos(rad);

                return (
                  <motion.div
                    key={action.label}
                    className="absolute group"
                    style={{
                      left: x,
                      bottom: -y,          /* bottom offset because container origin is at bottom */
                      transform: 'translate(-50%, 50%)',
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      delay: i * 0.06,
                      duration: 0.35,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  >
                    {/* Label above the icon */}
                    <motion.div
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 + 0.15 }}
                    >
                      <div
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/90"
                        style={{
                          background: 'rgba(14,14,24,0.88)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        {action.label}
                      </div>
                    </motion.div>

                    {/* Icon button */}
                    <motion.button
                      onClick={() => setShowActions(false)}
                      className="w-[58px] h-[58px] rounded-full flex items-center justify-center relative"
                      style={{
                        background: 'rgba(12,12,22,0.92)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(16px)',
                        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${action.color}22`,
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      {/* Subtle colour bloom */}
                      <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{
                          background: `radial-gradient(circle, ${action.color}18 0%, transparent 70%)`,
                        }}
                      />
                      <action.icon className="w-[22px] h-[22px] text-white relative z-10" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════
            Input bar
        ════════════════════════════════════════════════ */}
        <div
          className="arc-root flex items-center gap-3 px-5 pr-5"
          style={{
            height: '72px',
            borderRadius: '999px',
            background: 'rgba(12,12,22,0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow:
              '0 0 0 1px rgba(139,92,246,0.06), 0 24px 64px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Plus / X toggle button */}
          <motion.button
            ref={plusRef}
            onClick={() => setShowActions((v) => !v)}
            className="w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 relative"
            style={{
              background: showActions
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: showActions
                ? '0 0 24px rgba(124,58,237,0.55)'
                : 'none',
            }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {showActions ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X className="w-[20px] h-[20px] text-white" />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ rotate: 45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -45, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Plus className="w-[20px] h-[20px] text-gray-400" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Text area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Euler anything..."
            rows={1}
            className="flex-1 bg-transparent resize-none focus:outline-none text-gray-200 placeholder-gray-600 text-[15px] leading-6"
            style={{ minHeight: '28px', maxHeight: '120px', paddingTop: '6px', paddingBottom: '6px' }}
          />

          {/* Mic button */}
          <motion.button
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
          >
            <Mic className="w-[17px] h-[17px] text-gray-400" />
          </motion.button>

          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 0 24px rgba(124,58,237,0.55)',
              opacity: input.trim() ? 1 : 0.85,
            }}
            whileHover={input.trim() ? { scale: 1.07 } : {}}
            whileTap={input.trim() ? { scale: 0.93 } : {}}
          >
            <Send className="w-[17px] h-[17px] text-white" style={{ transform: 'translateX(1px)' }} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
