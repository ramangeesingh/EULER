import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ExternalLink, Loader2, Globe } from 'lucide-react';

export default function PreviewPanel({ html, device, siteTitle }) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // force iframe reload

  // When html changes, reload the iframe
  useEffect(() => {
    setIsLoading(true);
    setKey((k) => k + 1);
  }, [html]);

  const handleLoad = () => setIsLoading(false);

  const handleReload = () => {
    setIsLoading(true);
    setKey((k) => k + 1);
  };

  const handleOpenBlank = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoke after a short delay to let the tab load
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0,0,0,0.3)' }}>
      {/* Preview toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.35)' }}
      >
        {/* Fake browser chrome dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>

        {/* URL bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Globe className="w-3 h-3 text-gray-500 shrink-0" />
          <span className="text-[12px] text-gray-500 truncate">
            {siteTitle ? `preview — ${siteTitle}` : 'euler://preview'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReload}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
            title="Reload preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenBlank}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe container */}
      <div className="flex-1 overflow-hidden flex items-start justify-center" style={{ background: '#0e0e14', padding: device === 'mobile' ? '20px' : '0' }}>
        <motion.div
          className="relative h-full"
          animate={{
            width: device === 'mobile' ? '390px' : '100%',
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          style={{
            boxShadow: device === 'mobile' ? '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.6)' : 'none',
            borderRadius: device === 'mobile' ? '16px' : '0',
            overflow: 'hidden',
            maxHeight: '100%',
          }}
        >
          {/* Loading skeleton */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
                style={{ background: '#0e0e14' }}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="text-[13px] text-gray-500">Rendering preview...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={html}
            onLoad={handleLoad}
            className="w-full h-full border-0"
            style={{
              display: 'block',
              background: '#fff',
            }}
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </motion.div>
      </div>
    </div>
  );
}
