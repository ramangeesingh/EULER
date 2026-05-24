import { useEffect, useRef } from 'react';

/* Sparse, barely-visible star field matching the reference's minimal space atmosphere */
export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();

    /* Sparse star set — reference has very few, tiny, barely-visible particles */
    const stars = Array.from({ length: 72 }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      r:     Math.random() * 0.9 + 0.2,
      base:  Math.random() * 0.30 + 0.05,   // very low base opacity
      op:    0,
      spd:   (Math.random() * 0.25 + 0.08) * (Math.random() > 0.5 ? 1 : -1),
    }));
    stars.forEach(s => { s.op = s.base; });

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const alpha = Math.max(0, Math.min(s.base + 0.2, s.op));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215, 215, 240, ${alpha})`;
        ctx.fill();
        s.op += s.spd * 0.006;
        if (s.op > s.base + 0.18 || s.op < s.base - 0.05) s.spd *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

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
      style={{ opacity: 0.75 }}
    />
  );
}
