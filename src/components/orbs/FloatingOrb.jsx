import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function FloatingOrb({ size = 300, color = 'from-purple-500 to-blue-500', delay = 0, duration = 8 }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 0.1, 
        y: (e.clientY / window.innerHeight - 0.5) * 0.1 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-to-br ${color} glow-orb pointer-events-none`}
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      animate={{
        x: [0, 40 + mousePos.x * 100, -30 + mousePos.x * 80, 20, 0],
        y: [0, -40 + mousePos.y * 100, 30 + mousePos.y * 80, -20, 0],
        scale: [1, 1.08, 0.95, 1.05, 1],
        rotate: [0, 3, -3, 2, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}
