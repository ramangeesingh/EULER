import { motion } from 'framer-motion';

export default function WelcomeScreen() {
  return (
    <motion.div
      className="h-full flex flex-col items-center justify-start"
      style={{ paddingTop: '140px' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Floating purple orb ── */}
      <motion.div
        className="mb-14"
        animate={{ y: [0, -10, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative w-[80px] h-[80px] mx-auto">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 35% 28%, rgba(180,130,255,0.9) 0%, rgba(100,60,220,0.8) 40%, rgba(40,20,120,0.95) 75%, rgba(10,8,30,1) 100%)',
              boxShadow:
                '0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          />
          {/* Inner highlight */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '12px',
              background:
                'radial-gradient(circle at 35% 30%, rgba(210,180,255,0.35) 0%, transparent 60%)',
            }}
          />
          {/* Pulsing glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: '-16px',
              background:
                'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        className="text-[34px] font-normal leading-tight mb-4 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <span className="text-glow-strong font-semibold">Hey Arjun, </span>
        <span className="text-white/90">how can I help you today?</span>
      </motion.h1>

      {/* ── Subtext ── */}
      <motion.p
        className="text-[16px] text-gray-400 leading-relaxed text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5 }}
      >
        Ask me anything about code, architecture, debugging,
        <br />
        or your next big idea.
      </motion.p>
    </motion.div>
  );
}
