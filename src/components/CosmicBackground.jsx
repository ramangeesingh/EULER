import { useEffect, useRef } from 'react';
import StarField from './StarField';

export default function CosmicBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1.0;
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: -10,
        background: '#000000',
      }}
    >
      {/* Layer 1: Cosmic video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        style={{
          position: 'absolute',
          top: '-18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '135%',
          height: '135%',
          objectFit: 'cover',
          objectPosition: 'center top',
          willChange: 'transform',
        }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
          type="video/mp4"
        />
      </video>

      {/* Layer 2: Dark overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" style={{ zIndex: 1 }} />

      {/* Layer 3: Stars and particles */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <StarField />
      </div>

      {/* Layer 4: Nebula/vortex glow (Atmospheric depth) */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        {/* Top-center ambient blue/cyan glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)',
            filter: 'blur(90px)',
          }}
        />

        {/* Subtle dark vignette to focus top-center */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center top, transparent 15%, rgba(0, 0, 0, 0.5) 85%)',
          }}
        />
      </div>
    </div>
  );
}
