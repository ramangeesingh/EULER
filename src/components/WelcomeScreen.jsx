import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function WelcomeScreen() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.trim().split(/\s+/)[0];

  return (
    <motion.div
      className="h-full flex flex-col items-center justify-start"
      style={{ paddingTop: '140px' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Headline ── */}
      <motion.h1
        className="text-[34px] font-normal leading-tight mb-4 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <span className="text-glow-strong font-semibold">Hey {firstName}, </span>
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
