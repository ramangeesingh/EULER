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

    let t = 0;
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.00022;
      drawBlob(ctx, t, W, H);
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

/* ═══════════════════════════════════════════════════════════
   BLOB RENDERER — strict reference replication

   Reference material:
   • Dense dark purple-black body (not transparent)
   • Warm gold/amber glow from lower area (key light)
   • Subtle cool blue ambient on upper surface
   • One small glossy specular spot
   • Soft edge — no outlines, no strokes, no glow lines
   • Compact asymmetric organic shape, right side off-screen
═══════════════════════════════════════════════════════════ */
function drawBlob(ctx, t, W, H) {
  const px = v => (v / 1440) * W;
  const py = v => (v / 900)  * H;

  // Very slow gentle oscillators for subtle liquid breathing
  const o1 = Math.sin(t * 0.55);
  const o2 = Math.sin(t * 0.42 + 1.1);
  const o3 = Math.sin(t * 0.68 + 2.3);
  const o4 = Math.sin(t * 0.50 + 3.5);
  const o5 = Math.sin(t * 0.75 + 0.7);

  // Gentle vertical buoyancy float
  const fy = py(Math.sin(t * 0.20) * 10);

  /* ── BLOB PATH ──────────────────────────────────────
     Compact, rounded organic shape.
     Center ~(1000, 400). Extends off right edge.
     Minimal deformation amplitude to avoid stretching.
  ──────────────────────────────────────────────────── */
  const blob = new Path2D();

  // Key anchors
  const top = [px(798  + o1 * 6), py(-8   + o2 * 4) + fy];
  const tr  = [px(1092 + o2 * 7), py(55   + o3 * 5) + fy];
  const rm  = [px(1440 + 20),     py(390  + o4 * 8) + fy];
  const br  = [px(1440 + 12),     py(730  + o1 * 7) + fy];
  const bot = [px(908  + o3 * 7), py(808  + o5 * 5) + fy];
  const bl  = [px(792  + o4 * 6), py(698  + o2 * 6) + fy];
  const lm  = [px(668  + o5 * 5), py(422  + o3 * 7) + fy];
  const ul  = [px(682  + o1 * 5), py(162  + o4 * 6) + fy];

  blob.moveTo(...top);
  blob.bezierCurveTo(
    px(858+o2*5), py(-18+o1*3)+fy,  px(988+o3*6), py(18+o2*4)+fy,  ...tr);
  blob.bezierCurveTo(
    px(1238+o4*6),py(128+o3*5)+fy, px(1440+16),  py(272+o5*7)+fy, ...rm);
  blob.bezierCurveTo(
    px(1440+18), py(558+o1*6)+fy,  px(1440+14),  py(648+o2*5)+fy, ...br);
  blob.bezierCurveTo(
    px(1322+o3*6),py(808+o4*5)+fy, px(1082+o5*6),py(848+o1*5)+fy, ...bot);
  blob.bezierCurveTo(
    px(858+o1*5), py(802+o2*5)+fy, px(818+o2*6), py(768+o3*5)+fy, ...bl);
  blob.bezierCurveTo(
    px(748+o3*5), py(660+o4*5)+fy, px(668+o4*4), py(558+o5*6)+fy, ...lm);
  blob.bezierCurveTo(
    px(644+o5*4), py(318+o1*6)+fy, px(648+o1*5), py(228+o2*5)+fy, ...ul);
  blob.bezierCurveTo(
    px(662+o2*4), py(72+o3*4)+fy,  px(678+o3*4), py(12+o4*3)+fy,  ...top);
  blob.closePath();

  /* ── LAYER 1: Faint ambient warmth ──────────────────
     Very large, very faint warm haze — barely perceptible.
     This is the ONLY truly blurry layer.
  ──────────────────────────────────────────────────── */
  ctx.save();
  ctx.filter = 'blur(55px)';
  const ambient = ctx.createRadialGradient(
    px(968), py(558) + fy, 0,
    px(968), py(558) + fy, px(380)
  );
  ambient.addColorStop(0,   'rgba(148, 92, 18, 0.14)');
  ambient.addColorStop(0.5, 'rgba(80,  48,  8, 0.07)');
  ambient.addColorStop(1,   'rgba(0,   0,   0, 0)');
  ctx.fillStyle = ambient;
  ctx.fill(blob);
  ctx.restore();

  /* ── LAYER 2: Soft outer edge halo ──────────────────
     Draws the blob slightly expanded + blurred.
     Creates edge softness WITHOUT any outline/stroke.
  ──────────────────────────────────────────────────── */
  ctx.save();
  ctx.filter = 'blur(18px)';
  const edgeHalo = ctx.createRadialGradient(
    px(918), py(418) + fy, 0,
    px(918), py(418) + fy, px(408)
  );
  edgeHalo.addColorStop(0,   'rgba(48, 28, 85, 0.22)');
  edgeHalo.addColorStop(0.55,'rgba(28, 15, 52, 0.14)');
  edgeHalo.addColorStop(1,   'rgba(0,  0,  0,  0)');
  ctx.fillStyle = edgeHalo;
  ctx.fill(blob);
  ctx.restore();

  /* ── LAYER 3: MAIN BLOB INTERIOR ─────────────────────
     Clipped to the blob shape.
     No strokes. No outlines. Pure gradient fills.
  ──────────────────────────────────────────────────── */
  ctx.save();
  ctx.clip(blob);

  // 3a. Dense dark base — the "liquid glass / obsidian" body
  //     High opacity so it reads as a solid object, not a nebula
  const base = ctx.createRadialGradient(
    px(828), py(268) + fy, px(60),
    px(958), py(442) + fy, px(432)
  );
  base.addColorStop(0,    'rgba(42, 26, 78, 0.92)');
  base.addColorStop(0.30, 'rgba(26, 15, 52, 0.90)');
  base.addColorStop(0.58, 'rgba(15,  9, 32, 0.88)');
  base.addColorStop(0.80, 'rgba( 8,  5, 18, 0.84)');
  base.addColorStop(1,    'rgba( 4,  2,  9, 0.78)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // 3b. WARM GOLDEN KEY LIGHT — primary lighting feature
  //     Concentrated in lower center — exactly like reference
  const warm = ctx.createRadialGradient(
    px(952 + o1 * 7), py(605 + o2 * 5) + fy, 0,
    px(952 + o1 * 7), py(605 + o2 * 5) + fy, px(295)
  );
  warm.addColorStop(0,    'rgba(242, 178, 48, 0.78)');
  warm.addColorStop(0.12, 'rgba(225, 152, 30, 0.65)');
  warm.addColorStop(0.28, 'rgba(192, 118, 16, 0.45)');
  warm.addColorStop(0.50, 'rgba(148,  85,  8, 0.24)');
  warm.addColorStop(0.72, 'rgba( 88,  50,  3, 0.09)');
  warm.addColorStop(1,    'rgba(  0,   0,  0, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  // 3c. Secondary warm spread — broadens the key light naturally
  const warmSpread = ctx.createRadialGradient(
    px(1008 + o2 * 5), py(518 + o3 * 4) + fy, 0,
    px(1008 + o2 * 5), py(518 + o3 * 4) + fy, px(380)
  );
  warmSpread.addColorStop(0,   'rgba(185, 118, 22, 0.28)');
  warmSpread.addColorStop(0.4, 'rgba(118,  72, 10, 0.14)');
  warmSpread.addColorStop(1,   'rgba(  0,   0,  0, 0)');
  ctx.fillStyle = warmSpread;
  ctx.fillRect(0, 0, W, H);

  // 3d. Cool blue-purple ambient — upper surface secondary light
  const cool = ctx.createRadialGradient(
    px(798), py(228) + fy, 0,
    px(828), py(268) + fy, px(268)
  );
  cool.addColorStop(0,   'rgba(55, 115, 198, 0.18)');
  cool.addColorStop(0.4, 'rgba(35,  75, 155, 0.10)');
  cool.addColorStop(1,   'rgba( 0,   0,   0, 0)');
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, W, H);

  // 3e. Subtle purple mid-body tint
  const purple = ctx.createRadialGradient(
    px(918), py(368) + fy, 0,
    px(918), py(368) + fy, px(238)
  );
  purple.addColorStop(0,   'rgba(105, 58, 188, 0.16)');
  purple.addColorStop(0.5, 'rgba( 68, 38, 138, 0.08)');
  purple.addColorStop(1,   'rgba(  0,  0,   0, 0)');
  ctx.fillStyle = purple;
  ctx.fillRect(0, 0, W, H);

  // 3f. Single glossy specular spot — small, soft, believable
  //     Upper area, slightly off-center — where ambient light reflects
  const specX = px(808 + o3 * 7);
  const specY = py(212 + o4 * 5) + fy;
  const spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, px(88));
  spec.addColorStop(0,    'rgba(255, 250, 242, 0.28)');
  spec.addColorStop(0.25, 'rgba(245, 238, 225, 0.16)');
  spec.addColorStop(0.60, 'rgba(228, 220, 208, 0.06)');
  spec.addColorStop(1,    'rgba(  0,   0,   0, 0)');
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, W, H);

  ctx.restore(); // ── end clip ──

  /* ── LAYER 4: Small floating dark spheres ───────────
     Matches reference — 2 small dark spheres upper-right
  ──────────────────────────────────────────────────── */
  drawSphere(ctx, px(1155 + o2 * 3), py(48 + o1 * 5) + fy * 0.5, px(18));
  drawSphere(ctx, px(1268 + o3 * 2), py(285 + o4 * 4) + fy * 0.35, px(12));
}

function drawSphere(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.30, cy - r * 0.30, 0, cx, cy, r);
  g.addColorStop(0,   'rgba(58, 50, 88, 0.92)');
  g.addColorStop(0.6, 'rgba(16, 12, 34, 0.96)');
  g.addColorStop(1,   'rgba( 4,  3,  9, 1.00)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  // tiny specular
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(195, 185, 245, 0.22)';
  ctx.fill();
}
