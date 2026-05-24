import { motion } from 'framer-motion';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100',
    secondary: 'glass hover:bg-white/10 text-white',
    ghost: 'hover:bg-white/5 text-white',
  };

  return (
    <motion.button
      className={`px-6 py-3 rounded-full font-medium transition-all ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
