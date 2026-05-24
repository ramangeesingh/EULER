import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      className={`glass rounded-2xl p-6 ${className}`}
      whileHover={hover ? { scale: 1.02, borderColor: 'rgba(255, 255, 255, 0.2)' } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
