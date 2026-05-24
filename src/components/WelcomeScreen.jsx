import { motion } from 'framer-motion';

export default function WelcomeScreen() {
  return (
    <motion.div
      className="h-full flex justify-center px-8 pt-[202px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-[720px] -translate-x-[55px] text-center">
        {/* Animated Orb */}
        <motion.div
          className="inline-block mb-[75px]"
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="relative w-[88px] h-[88px] mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 opacity-80" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-purple-500 opacity-60" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-300 via-blue-300 to-purple-400 opacity-40" />
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500/30 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.h1
          className="text-[40px] leading-[1.12] font-normal mb-[25px] whitespace-nowrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-glow-strong font-bold">Hey Arjun, </span>
          <span className="text-white">how can I help you today?</span>
        </motion.h1>

        <motion.p
          className="text-[22px] text-gray-300/85 leading-[1.55]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Ask me anything about code, architecture, debugging,<br />or your next big idea.
        </motion.p>
      </div>
    </motion.div>
  );
}
