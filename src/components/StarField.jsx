import { useEffect, useRef } from 'react';

export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Generate stars
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.2 + 0.1,
      baseOpacity: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      speed: (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, s.opacity))})`;
        ctx.fill();
        s.opacity += s.speed * 0.008;
        if (s.opacity > s.baseOpacity + 0.3 || s.opacity < 0.05) s.speed *= -1;
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.55 }}
    />
  );
}
