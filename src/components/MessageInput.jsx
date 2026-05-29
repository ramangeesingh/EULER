import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Plus, X, Upload, Globe, Code, Network } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Action items that fan out in a semicircle ABOVE the plus button.
 * Labels only appear on hover for a clean, premium look.
 */
const ACTIONS = [
  { id: 'upload-repo', icon: Upload, label: 'Repo intellegence', color: '#a855f7', glowColor: 'rgba(168,85,247,0.3)' },
  { id: 'build-site', icon: Globe, label: 'Build Website', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)' },
  { id: 'analyze', icon: Code, label: 'AI dev assistant', color: '#22c55e', glowColor: 'rgba(34,197,94,0.3)' },
  { id: 'architecture', icon: Network, label: 'Architecture engine', color: '#f97316', glowColor: 'rgba(249,115,22,0.3)' },
];

/** Radius of the semicircle arc (px) */
const RADIUS = 95;

/**
 * Calculate x,y positions for N items spread evenly in a semicircle above the origin.
 * The arc spans from -75° to +75° (measuring from straight up = 0°).
 */
function getArcPosition(index, total) {
  const startAngle = -75; // degrees from vertical (left side)
  const endAngle = 75;    // degrees from vertical (right side)
  const step = (endAngle - startAngle) / (total - 1);
  const angleDeg = startAngle + step * index;
  const angleRad = (angleDeg * Math.PI) / 180;

  // x: sin gives horizontal displacement (positive = right)
  // y: cos gives vertical displacement (positive = up, so we negate for CSS)
  return {
    x: RADIUS * Math.sin(angleRad),
    y: -RADIUS * Math.cos(angleRad), // negative because CSS y goes down
  };
}

export default function MessageInput({ onSendMessage, isStreaming, onAction }) {
  const [input, setInput] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }

          // If we have final text, append it to the current input
          if (finalTranscript) {
            setInput((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
          }
          // Note: we could display interim text, but for simplicity we just capture finals
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Failed to start recognition', e);
        }
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
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
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowActions(false);
        setHoveredIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showActions]);

  return (
    <div className="relative px-6 pb-6">
      <div ref={containerRef} className="max-w-[820px] mx-auto relative">

        {/* ═══════════════════════════════════════════
            Semicircular action arc — NO rainbow curve
        ═══════════════════════════════════════════ */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              key="arc-container"
              className="absolute"
              style={{
                /* Position the arc origin at the center of the + button.
                   The + button is at the left of the input bar.
                   left: padding (20px) + half button width (24px) = 44px from container left.
                   bottom: half input height (36px) */
                bottom: '36px',
                left: '44px',
                width: 0,
                height: 0,
                zIndex: 50,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >

              {/* Action icons placed along the semicircle */}
              {ACTIONS.map((action, i) => {
                const pos = getArcPosition(i, ACTIONS.length);
                const isHovered = hoveredIndex === i;

                return (
                  <motion.div
                    key={action.label}
                    className="absolute"
                    style={{
                      left: `${pos.x}px`,
                      bottom: `${-pos.y}px`,
                      transform: 'translate(-50%, 50%)',
                      zIndex: isHovered ? 60 : 51,
                    }}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 20 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.4,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(-1)}
                  >
                    {/* Tooltip label — only visible on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          className="absolute bottom-full mb-3 left-1/2 whitespace-nowrap pointer-events-none"
                          style={{ transform: 'translateX(-50%)' }}
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            className="px-3.5 py-2 rounded-xl text-[12px] font-semibold tracking-wide text-white"
                            style={{
                              background: `linear-gradient(135deg, ${action.color}22, rgba(12,12,22,0.95))`,
                              border: `1px solid ${action.color}44`,
                              backdropFilter: 'blur(16px)',
                              boxShadow: `0 4px 20px ${action.color}22, 0 0 0 1px rgba(255,255,255,0.05)`,
                            }}
                          >
                            {action.label}
                          </div>
                          {/* Small triangle pointer */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-4px',
                              left: '50%',
                              transform: 'translateX(-50%) rotate(45deg)',
                              width: '8px',
                              height: '8px',
                              background: 'rgba(12,12,22,0.95)',
                              borderRight: `1px solid ${action.color}44`,
                              borderBottom: `1px solid ${action.color}44`,
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Icon button */}
                    <motion.button
                      onClick={() => { setShowActions(false); if (action.id) onAction?.(action.id); }}
                      className="relative flex items-center justify-center"
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: isHovered
                          ? `radial-gradient(circle at center, ${action.color}20, rgba(12,12,22,0.95))`
                          : 'rgba(12,12,22,0.92)',
                        border: `1.5px solid ${isHovered ? action.color + '55' : 'rgba(255,255,255,0.1)'}`,
                        backdropFilter: 'blur(16px)',
                        boxShadow: isHovered
                          ? `0 0 30px ${action.glowColor}, 0 8px 32px rgba(0,0,0,0.5)`
                          : '0 8px 32px rgba(0,0,0,0.5)',
                        transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
                      }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      {/* Glow ring on hover */}
                      <motion.div
                        className="absolute inset-[-3px] rounded-full"
                        style={{
                          background: `conic-gradient(from 0deg, ${action.color}00, ${action.color}33, ${action.color}00)`,
                          opacity: isHovered ? 1 : 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                      {/* Inner circle mask */}
                      <div
                        className="absolute inset-[1px] rounded-full"
                        style={{ background: isHovered ? `rgba(12,12,22,0.9)` : 'rgba(12,12,22,0.92)' }}
                      />
                      <action.icon
                        className="relative z-10"
                        style={{
                          width: '20px',
                          height: '20px',
                          color: isHovered ? action.color : 'rgba(255,255,255,0.7)',
                          transition: 'color 0.25s ease',
                          filter: isHovered ? `drop-shadow(0 0 6px ${action.glowColor})` : 'none',
                        }}
                      />
                    </motion.button>
                  </motion.div>
                );
              })}

              {/* Subtle radial glow behind the arc */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: '-100px',
                  bottom: '0',
                  width: '200px',
                  height: '160px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at center bottom, rgba(124,58,237,0.08) 0%, transparent 70%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════
            Input bar
        ═══════════════════════════════════════════ */}
        <div
          className="flex items-center gap-3 px-5 pr-5"
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
            onClick={() => {
              setShowActions((v) => !v);
              setHoveredIndex(-1);
            }}
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

          {/* Text area & Voice Bars */}
          <div className="flex-1 flex items-center relative h-full">
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  className="absolute left-0 flex items-center gap-[4px] h-[28px] pointer-events-none"
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full"
                      style={{
                        background: 'linear-gradient(to top, #7c3aed, #3b82f6)',
                        boxShadow: '0 0 8px rgba(124,58,237,0.5)'
                      }}
                      animate={{
                        height: ['20%', '100%', '40%', '80%', '30%']
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.7 + (i * 0.15),
                        repeatType: "mirror",
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isListening ? "Listening..." : "Ask Euler anything..."}
              rows={1}
              className="flex-1 bg-transparent resize-none focus:outline-none text-gray-200 placeholder-gray-600 text-[15px] leading-6 transition-all duration-300"
              style={{
                minHeight: '28px',
                maxHeight: '120px',
                paddingTop: '6px',
                paddingBottom: '6px',
                paddingLeft: isListening ? '44px' : '0px'
              }}
            />
          </div>

          {/* Mic button */}
          <motion.button
            onClick={toggleListening}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 relative"
            style={{
              background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`
            }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
          >
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            <Mic className={`w-[17px] h-[17px] relative z-10 ${isListening ? 'text-red-400' : 'text-gray-400'}`} />
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
