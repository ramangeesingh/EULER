import { useEffect, useRef, useState } from 'react';

export default function VideoBackground() {
  const videoRef = useRef(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const loopStartTimeRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 1.0;

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      // Cache the exact loop start time for frame-perfect looping
      loopStartTimeRef.current = duration - 3.3;
    };

    const handleTimeUpdate = () => {
      const duration = video.duration;
      if (!duration || loopStartTimeRef.current === null) return;

      const loopStartTime = loopStartTimeRef.current;
      const currentTime = video.currentTime;

      // First playthrough: mark intro as played when reaching loop point
      if (!introPlayed && currentTime >= loopStartTime) {
        setIntroPlayed(true);
      }

      // After intro played: seamless loop with precise timing
      if (introPlayed && currentTime >= duration - 0.016) { // ~1 frame at 60fps
        // Use requestAnimationFrame for smoother seeking
        requestAnimationFrame(() => {
          video.currentTime = loopStartTime;
        });
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [introPlayed]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: -10,
        background: 'black',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center center',
          willChange: 'transform',
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
