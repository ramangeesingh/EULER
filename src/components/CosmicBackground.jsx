import { useEffect, useRef } from 'react';

export default function CosmicBackground() {
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
    window.addEventListener('resize', resize);

    let t = 0, animId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.0007; // Smooth animation speed
      drawScene(ctx, t, W, H);
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM DYNAMIC LIQUID-METAL SCENERY
   
   Replicates the reference image's organic, soft-edged, and
   highly reflective liquid-metal blob emerging from the bottom.
   
   Uses a Bezier-based path for a truly asymmetrical, flowing
   silhouette, and globalCompositeOperation = 'source-atop' to
   clip interior metallic shading and specular details seamlessly.
   ═══════════════════════════════════════════════════════════════ */
function drawScene(ctx, t, W, H) {
  const ax = W * 0.58; // Center of main workspace area
  
  /* ─────────────────────────────────────────────────────────
     STEP 1 — AMBIENT BACKGROUND GLOW
     Deep luxury space atmospheric lighting behind the blob.
  ───────────────────────────────────────────────────────── */
  ctx.save();
  ctx.filter = 'blur(90px)';
  const bgGlow = ctx.createRadialGradient(
    ax, H * 0.78, H * 0.02,
    ax, H * 0.78, H * 0.58
  );
  bgGlow.addColorStop(0, 'rgba(42, 22, 88, 0.32)');   // Rich amethyst bloom
  bgGlow.addColorStop(0.45, 'rgba(20, 10, 45, 0.15)'); // Soft purple transition
  bgGlow.addColorStop(0.80, 'rgba(120, 75, 18, 0.04)'); // Subtle warm aura leak
  bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  /* ─────────────────────────────────────────────────────────
     STEP 2 — THE ORGANIC LIQUID FORM (CANVAS RENDERING)
  ───────────────────────────────────────────────────────── */
  drawLiquidBlob(ctx, t, W, H, ax);
}

function drawLiquidBlob(ctx, t, W, H, ax) {
  // Proportions remain elegant regardless of display resolution
  const blobWidth = Math.min(W * 0.28, 410);
  const blobHeight = Math.min(H * 0.42, 390);
  const ay = H + 40; // Flat bottom remains hidden below the fold

  /* Multi-frequency slow oscillators for continuous molten flow */
  const o1 = Math.sin(t * 1.1) * 14;
  const o2 = Math.cos(t * 0.8) * 11;
  const o3 = Math.sin(t * 1.4 + 1.2) * 10;
  const o4 = Math.cos(t * 1.0 + 2.1) * 13;
  const o5 = Math.sin(t * 0.6 + 0.5) * 8;

  // Bezier curve path defining a smooth, irregular, multi-lobed droplet
  const getBlobPath = (c) => {
    const leftX = ax - blobWidth + o3;
    const rightX = ax + blobWidth + o4;

    c.beginPath();
    c.moveTo(leftX, ay);

    // Left side curving up to Left Peak
    c.bezierCurveTo(
      ax - blobWidth * 0.90 + o1, ay - blobHeight * 0.45 + o2,
      ax - blobWidth * 0.70 + o3, ay - blobHeight * 0.95 + o4,
      ax - blobWidth * 0.40 + o2, ay - blobHeight * 1.02 + o5 // Left Peak
    );

    // Trough (dip between lobes)
    c.bezierCurveTo(
      ax - blobWidth * 0.15 + o1, ay - blobHeight * 1.04 + o3,
      ax + blobWidth * 0.05 + o4, ay - blobHeight * 0.76 + o2,
      ax + blobWidth * 0.25 + o5, ay - blobHeight * 0.82 + o1 // Trough / dip
    );

    // Right Peak / upper shoulder
    c.bezierCurveTo(
      ax + blobWidth * 0.45 + o2, ay - blobHeight * 0.86 + o3,
      ax + blobWidth * 0.65 + o1, ay - blobHeight * 0.84 + o4,
      ax + blobWidth * 0.80 + o5, ay - blobHeight * 0.68 + o2 // Right Peak
    );

    // Right side falling to bottom edge
    c.bezierCurveTo(
      ax + blobWidth * 0.90 + o3, ay - blobHeight * 0.42 + o1,
      ax + blobWidth * 0.95 + o2, ay - blobHeight * 0.12 + o4,
      rightX, ay
    );

    c.lineTo(leftX, ay);
    c.closePath();
  };

  /* ─────────────────────────────────────────────────────────
     BASE MASS DRAWING
     Drawn with a blur filter to achieve soft, organic edges
     that dissolve naturally into the dark starfield background.
  ───────────────────────────────────────────────────────── */
  ctx.save();
  ctx.filter = 'blur(10px)'; // Soft cinematic edges
  getBlobPath(ctx);

  // Gradient reflecting dark glossy purple and obsidian tones
  const baseGrad = ctx.createLinearGradient(ax, H, ax, ay - blobHeight);
  baseGrad.addColorStop(0, '#020108');      // Deep charcoal/black base
  baseGrad.addColorStop(0.35, '#070415');   // Rich dark obsidian
  baseGrad.addColorStop(0.70, '#130d2a');   // High-density purple
  baseGrad.addColorStop(1, '#1d123a');      // Top boundary tint
  ctx.fillStyle = baseGrad;
  ctx.fill();

  /* ─────────────────────────────────────────────────────────
     METALLIC / REFLECTIVE SHADING
     Using globalCompositeOperation = 'source-atop' so all subsequent
     speculars and reflections mask perfectly to our soft silhouette.
  ───────────────────────────────────────────────────────── */
  ctx.globalCompositeOperation = 'source-atop';

  // 1. Deep magenta-violet internal shadow (lower-left)
  const violetRefl = ctx.createRadialGradient(
    ax - blobWidth * 0.35, H - blobHeight * 0.35, H * 0.05,
    ax - blobWidth * 0.35, H - blobHeight * 0.35, H * 0.45
  );
  violetRefl.addColorStop(0, 'rgba(142, 70, 240, 0.24)');
  violetRefl.addColorStop(0.50, 'rgba(75, 30, 165, 0.09)');
  violetRefl.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = violetRefl;
  ctx.fill();

  // 2. Cool chromatic iridescence (blue/teal) inside lower-right curve
  const blueTealRefl = ctx.createRadialGradient(
    ax + blobWidth * 0.45, H - blobHeight * 0.45, H * 0.02,
    ax + blobWidth * 0.45, H - blobHeight * 0.45, H * 0.35
  );
  blueTealRefl.addColorStop(0, 'rgba(32, 205, 185, 0.09)'); // Soft teal sheen
  blueTealRefl.addColorStop(0.32, 'rgba(45, 105, 225, 0.14)'); // Ambient electric blue
  blueTealRefl.addColorStop(0.75, 'rgba(80, 30, 160, 0.06)'); // Indigo transition
  blueTealRefl.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = blueTealRefl;
  ctx.fill();

  // 3. Thick metallic gold reflection along Left Peak
  const goldLeft = ctx.createRadialGradient(
    ax - blobWidth * 0.42 + o3 * 0.8, ay - blobHeight * 0.86 + o2 * 0.8, H * 0.01,
    ax - blobWidth * 0.42 + o3 * 0.8, ay - blobHeight * 0.86 + o2 * 0.8, H * 0.22
  );
  goldLeft.addColorStop(0, 'rgba(255, 252, 235, 0.92)');    // Bright white-gold core
  goldLeft.addColorStop(0.14, 'rgba(246, 200, 56, 0.80)');   // Liquid yellow gold
  goldLeft.addColorStop(0.36, 'rgba(196, 125, 16, 0.52)');   // Warm metallic copper-gold
  goldLeft.addColorStop(0.68, 'rgba(125, 68, 6, 0.20)');     // Dark amber boundary
  goldLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = goldLeft;
  ctx.fill();

  // 4. Soft metallic gold reflection along Right Peak
  const goldRight = ctx.createRadialGradient(
    ax + blobWidth * 0.38 + o2 * 0.7, ay - blobHeight * 0.65 + o4 * 0.7, H * 0.01,
    ax + blobWidth * 0.38 + o2 * 0.7, ay - blobHeight * 0.65 + o4 * 0.7, H * 0.18
  );
  goldRight.addColorStop(0, 'rgba(255, 248, 220, 0.80)');
  goldRight.addColorStop(0.16, 'rgba(238, 186, 48, 0.68)');
  goldRight.addColorStop(0.42, 'rgba(182, 112, 12, 0.40)');
  goldRight.addColorStop(0.72, 'rgba(110, 55, 6, 0.14)');
  goldRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = goldRight;
  ctx.fill();

  // 5. Ambient glowing bottom-left crescent reflection (adds 3D volume)
  const bottomRim = ctx.createRadialGradient(
    ax - blobWidth * 0.60 + o1 * 0.5, H * 1.02 + o5, H * 0.10,
    ax - blobWidth * 0.60 + o1 * 0.5, H * 1.02 + o5, H * 0.48
  );
  bottomRim.addColorStop(0, 'rgba(255, 255, 255, 0.90)');    // Brilliant specular rim
  bottomRim.addColorStop(0.18, 'rgba(242, 218, 142, 0.70)'); // Gold luster reflection
  bottomRim.addColorStop(0.38, 'rgba(125, 165, 242, 0.38)'); // Light blue ambient glow
  bottomRim.addColorStop(0.72, 'rgba(40, 20, 135, 0.10)');   // Deep purple fade
  bottomRim.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bottomRim;
  ctx.fill();

  ctx.restore(); // Resets globalCompositeOperation and filter back to standard

  /* ─────────────────────────────────────────────────────────
     STEP 3 — SPECULAR HIGHLIGHTS (ON TOP OF THE BLURRED MASK)
     Drawn with a tight, high-contrast blur to keep details
     glossy, wet, and high-fidelity like physical liquid-glass.
  ───────────────────────────────────────────────────────── */
  ctx.save();
  ctx.filter = 'blur(4px)'; // Crisp specular spot blur

  // Hot spot 1 (Left Peak key light)
  const s1x = ax - blobWidth * 0.42 + o3 * 0.8;
  const s1y = ay - blobHeight * 0.88 + o2 * 0.8;
  const spec1 = ctx.createRadialGradient(s1x, s1y, 0, s1x, s1y, W * 0.055);
  spec1.addColorStop(0, 'rgba(255, 255, 255, 0.95)');    // Intense reflection core
  spec1.addColorStop(0.26, 'rgba(255, 244, 195, 0.60)'); // Warm gold specular glow
  spec1.addColorStop(0.65, 'rgba(242, 202, 92, 0.16)');  // Soft gold bloom
  spec1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spec1;
  ctx.fillRect(0, 0, W, H);

  // Hot spot 2 (Right shoulder secondary light)
  const s2x = ax + blobWidth * 0.38 + o2 * 0.7;
  const s2y = ay - blobHeight * 0.67 + o4 * 0.7;
  const spec2 = ctx.createRadialGradient(s2x, s2y, 0, s2x, s2y, W * 0.038);
  spec2.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  spec2.addColorStop(0.30, 'rgba(255, 242, 190, 0.45)');
  spec2.addColorStop(0.72, 'rgba(238, 192, 72, 0.10)');
  spec2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spec2;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}
