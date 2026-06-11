import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Database, Shield, Rocket, Server,
  RefreshCw, Copy, Check, ZoomIn, ZoomOut, Maximize2,
  Minimize2, Code2, Eye, X, AlertCircle,
} from 'lucide-react';
import mermaid from 'mermaid';
import { EulerLoader } from '../shared/EulerLogo';

// ─── One-time mermaid initialisation ─────────────────────────────────────────
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  darkMode: true,
  background: 'transparent',
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontSize: 13,
  flowchart: {
    curve: 'basis',
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 60,
    htmlLabels: true,
  },
  sequence: {
    actorMargin: 80,
    messageMargin: 40,
    mirrorActors: false,
    bottomMarginAdj: 10,
    useMaxWidth: true,
  },
  er: {
    useMaxWidth: true,
    layoutDirection: 'TB'
  },
  themeVariables: {
    primaryColor: '#1e3a5f',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#2563EB',
    lineColor: '#4b6cb7',
    secondaryColor: '#0f172a',
    tertiaryColor: '#1e293b',
    background: '#0a0a14',
    mainBkg: '#111827',
    nodeBorder: '#2563EB',
    clusterBkg: '#1e293b',
    titleColor: '#93C5FD',
    edgeLabelBackground: '#1e293b',
    activeTaskBorderColor: '#3b82f6',
    activeTaskBkgColor: '#1e3a5f',
    gridColor: '#1f2937',
    section0: '#111827',
    section1: '#0f172a',
    altSectionBkgColor: '#1e293b',
    taskTextColor: '#e2e8f0',
    taskTextOutsideColor: '#93C5FD',
    taskTextClickableColor: '#60a5fa',
    noteBkgColor: '#1e3a5f',
    noteTextColor: '#e2e8f0',
    noteBorderColor: '#2563EB',
    signalColor: '#93C5FD',
    signalTextColor: '#e2e8f0',
    labelBoxBkgColor: '#111827',
    labelBoxBorderColor: '#2563EB',
    labelTextColor: '#e2e8f0',
    loopTextColor: '#93c5fd',
    activationBorderColor: '#3b82f6',
    activationBkgColor: '#1e3a5f',
    sequenceNumberColor: '#93C5FD',
  },
});

// ─── Diagram type definitions ─────────────────────────────────────────────────
const DIAGRAM_TYPES = [
  { id: 'system', label: 'System Overview', icon: Server, desc: 'Frontend → Backend → DB flow' },
  { id: 'sequence', label: 'Auth Sequence', icon: Shield, desc: 'Login & token refresh flow' },
  { id: 'database', label: 'ER Diagram', icon: Database, desc: 'Tables & relationships' },
  { id: 'deployment', label: 'Deployment Pipeline', icon: Rocket, desc: 'Dev → Staging → Production' },
  { id: 'microservices', label: 'Microservices', icon: GitBranch, desc: 'Service communication map' },
];

// Helper functions for Mermaid sanitization
function extractMermaidCode(raw) {
  if (!raw) return '';
  const match = raw.match(/```mermaid([\s\S]*?)```/i);
  if (match) return match[1].trim();
  const generalMatch = raw.match(/```([\s\S]*?)```/);
  if (generalMatch) {
    const content = generalMatch[1].trim();
    if (/^(flowchart|graph|sequenceDiagram|erDiagram|classDiagram|stateDiagram|gantt|pie|journey|gitGraph|requirementDiagram)/i.test(content)) {
      return content;
    }
  }
  const keywords = [
    'flowchart', 'graph', 'sequenceDiagram', 'erDiagram', 'classDiagram',
    'stateDiagram-v2', 'stateDiagram', 'gantt', 'pie', 'journey', 'gitGraph', 'requirementDiagram'
  ];
  for (const keyword of keywords) {
    const index = raw.toLowerCase().indexOf(keyword.toLowerCase());
    if (index !== -1) return raw.slice(index).trim();
  }
  return raw.trim();
}

function sanitizeLabel(label) {
  if (!label) return '';
  let cleaned = label;

  // 1. Replace parentheses ()
  cleaned = cleaned.replace(/\s*\(([^)]*)\)/g, (match, p1) => ' - ' + p1);
  cleaned = cleaned.replace(/[()]/g, ' ');

  // 2. Replace slashes / and \
  cleaned = cleaned.replace(/[\/\\]/g, ' ');

  // 3. Replace colons :
  cleaned = cleaned.replace(/:/g, ' ');

  // 4. Remove unsupported special characters
  cleaned = cleaned.replace(/\bNode\.js\b/gi, 'Node');
  cleaned = cleaned.replace(/['"`]/g, ''); // Remove quotes
  //cleaned = cleaned.replace(/[\[\]\{\}]/g, ''); // Remove braces/brackets
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s.\-_]/g, '');

  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s*-\s*/g, ' - ');
  return cleaned.trim();
}

function sanitizeMermaidCode(code) {
  if (!code) return '';

  let sanitized = code.replace(/```mermaid\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  const lines = sanitized.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('%%') || !line.trim()) {
      return line;
    }

    // Sequence diagram Note/Participant/Actor processing
    let sequenceMatch = line.match(/^(.*?\bas\s+)(.+)$/i);
    if (sequenceMatch) {
      return sequenceMatch[1] + sanitizeLabel(sequenceMatch[2]);
    }

    // Sequence diagram message processing
    let msgMatch = line.match(/^([^:]+:\s*)(.+)$/);
    if (msgMatch && (line.includes('->') || line.includes('--'))) {
      return msgMatch[1] + sanitizeLabel(msgMatch[2]);
    }

    // ER diagram relationships
    let erMatch = line.match(/^([^:]+:\s*)(.+)$/);
    if (erMatch && (line.includes('|') || line.includes('}') || line.includes('{'))) {
      return erMatch[1] + sanitizeLabel(erMatch[2]);
    }

    let newLine = line;

    // Matching patterns like ID["content"], ID("content"), ID[(content)], etc.
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\[\"\s*)(.*?)(\s*\"\])/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\(\\"\s*)(.*?)(\s*\"\))/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\[\(\s*)(.*?)(\s*\)\])/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\(\[\s*)(.*?)(\s*\]\))/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\(\(\s*)(.*?)(\s*\)\))/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\[\[\s*)(.*?)(\s*\]\])/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\[\s*)(.*?)(\s*\])/g, (m, p1, p2, p3) => {
      if (p2.startsWith('[') || p2.startsWith('"') || p2.startsWith('(')) return m;
      return p1 + sanitizeLabel(p2) + p3;
    });
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\(\s*)(.*?)(\s*\))/g, (m, p1, p2, p3) => {
      if (p2.startsWith('[') || p2.startsWith('"') || p2.startsWith('(')) return m;
      return p1 + sanitizeLabel(p2) + p3;
    });
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\{\{\s*)(.*?)(\s*\}\})/g, (m, p1, p2, p3) => p1 + sanitizeLabel(p2) + p3);
    newLine = newLine.replace(/(\b[a-zA-Z0-9_-]+\s*\{\s*)(.*?)(\s*\})/g, (m, p1, p2, p3) => {
      if (p2.startsWith('{')) return m;
      return p1 + sanitizeLabel(p2) + p3;
    });

    return newLine;
  });

  return processedLines.join('\n');
}

// Asynchronous Mermaid syntax validation using mermaid.parse
async function validateMermaidSyntax(code) {
  try {
    await mermaid.parse(code);

    console.log('[MERMAID] Validation passed');
    return true;
  } catch (err) {
    console.error('\n[MERMAID VALIDATION FAILED]');
    console.error('Diagram:\n');
    console.error(code);
    console.error('\nError:\n');
    console.error(err);
    console.error('----------------------------------\n');

    return false;
  }
}

// ─── Mermaid renderer ─────────────────────────────────────────────────────────
function MermaidRenderer({ code, onRenderSuccess, onRenderFailed }) {
  const containerRef = useRef(null);
  const svgContainerRef = useRef(null);
  const uid = useId().replace(/:/g, '');
  const [status, setStatus] = useState('rendering'); // 'rendering' | 'done' | 'error'

  // zoom / pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // fullscreen
  const [fullscreen, setFullscreen] = useState(false);

  // view toggle: 'diagram' | 'code'
  const [view, setView] = useState('diagram');

  // copy code state
  const [copied, setCopied] = useState(false);

  // ── Render ──
  useEffect(() => {
    if (!code) return;
    setStatus('rendering');
    setZoom(1);
    setPan({ x: 0, y: 0 });

    const diagId = `mermaid-${uid}-${Date.now()}`;

    // Use a hidden scratch element to render
    const scratch = document.createElement('div');
    scratch.style.visibility = 'hidden';
    scratch.style.position = 'absolute';
    scratch.style.top = '-9999px';
    scratch.style.left = '-9999px';
    document.body.appendChild(scratch);

    try {
      mermaid.render(diagId, code, scratch)
        .then(({ svg }) => {
          if (!svgContainerRef.current) return;
          // Inject SVG
          svgContainerRef.current.innerHTML = svg;
          const svgEl = svgContainerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.maxWidth = 'none';
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');
          }
          setStatus('done');
          onRenderSuccess?.();
          document.body.removeChild(scratch);
        })
        .catch((err) => {
          setStatus('error');
          onRenderFailed?.(err?.message || 'Mermaid render error');
          try { document.body.removeChild(scratch); } catch { }
        });
    } catch (err) {
      setStatus('error');
      onRenderFailed?.(err?.message || 'Mermaid render error');
      try { document.body.removeChild(scratch); } catch { }
    }

    return () => {
      try { document.body.removeChild(scratch); } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ── Wheel zoom ──
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.2), 5));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Drag pan ──
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = 'grabbing';
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  };
  const handleMouseUp = (e) => {
    isDragging.current = false;
    e.currentTarget.style.cursor = 'grab';
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wrapStyle = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(4,4,14,0.98)', backdropFilter: 'blur(20px)' }
    : { height: '100%' };

  return (
    <div style={wrapStyle} className="flex flex-col">
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.35)' }}
      >
        {/* Browser dots */}
        <div className="flex items-center gap-1.5 mr-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.7)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,158,11,0.7)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.7)' }} />
        </div>

        {/* View toggle */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { id: 'diagram', label: 'Diagram', icon: Eye },
            { id: 'code', label: 'Code', icon: Code2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
              style={{
                background: view === id ? 'rgba(37,99,235,0.22)' : 'transparent',
                color: view === id ? '#93C5FD' : 'rgba(156,163,175,0.6)',
                border: view === id ? '1px solid rgba(37,99,235,0.32)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Zoom controls (diagram view only) */}
        {view === 'diagram' && status === 'done' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(z => Math.max(z * 0.8, 0.2))}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all min-w-[46px] text-center"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(z => Math.min(z * 1.25, 5))}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
          style={{
            background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#6ee7b7' : '#9ca3af',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen(f => !f)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Close fullscreen (X button) */}
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden relative" ref={containerRef}>

        {/* ── Diagram view ── */}
        {view === 'diagram' && (
          <>
            {/* Rendering spinner */}
            <AnimatePresence>
              {status === 'rendering' && (
                <motion.div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(6,6,18,0.9)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
                  >
                    <EulerLoader className="w-8 h-8" />
                  </div>
                  <p className="text-gray-500 text-[12.5px]">Rendering diagram…</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error state */}
            <AnimatePresence>
              {status === 'error' && (
                <motion.div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-red-400 text-[13px] font-medium mb-1">Something went wrong.</p>
                    <p className="text-gray-600 text-[11px] max-w-xs leading-relaxed">Please try again.</p>
                  </div>
                  <button
                    onClick={() => setView('code')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    View raw code
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG canvas — pan & zoom */}
            <div
              className="absolute inset-0 overflow-hidden select-none"
              style={{ cursor: 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={svgContainerRef}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: '100%',
                  transition: isDragging.current ? 'none' : 'transform 0.05s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                }}
              />
            </div>

            {/* Pan/zoom hint */}
            {status === 'done' && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10.5px] text-gray-700 pointer-events-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Scroll to zoom · Drag to pan
              </div>
            )}
          </>
        )}

        {/* ── Code view ── */}
        {view === 'code' && (
          <div className="h-full overflow-auto sidebar-scroll p-5">
            <pre
              className="text-[12px] font-mono leading-[1.75]"
              style={{ fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace" }}
            >
              {(code || '').split('\n').map((line, i) => {
                const t = line.trim();
                let color = '#d1d5db';
                if (i === 0) color = '#93C5FD';
                else if (t.startsWith('%%')) color = '#4b5563';
                else if (t.includes('-->') || t.includes('->')) color = '#93c5fd';
                else if (t.includes(':::') || t.startsWith('style')) color = '#fcd34d';
                else if (t.startsWith('subgraph') || t === 'end') color = '#60A5FA';
                else if (t.startsWith('note') || t.startsWith('participant') || t.startsWith('actor')) color = '#6ee7b7';
                return (
                  <span key={i} style={{ color, display: 'block' }}>
                    {line || '\u00A0'}
                  </span>
                );
              })}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main DiagramView ─────────────────────────────────────────────────────────
export default function DiagramView({ architecture }) {
  const [activeType, setActiveType] = useState('system');
  const [diagrams, setDiagrams] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryFlags, setRetryFlags] = useState({}); // Keep track of auto-retries per type

  const loadDiagram = async (type, isAutoRetry = false) => {
    setActiveType(type);

    if (!isAutoRetry) {
      // Reset retry flag for manual attempts
      setRetryFlags(prev => ({ ...prev, [type]: false }));
    }

    if (!isAutoRetry && diagrams[type]) {
      setError(null);
      return; // cache hit
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/architecture/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architecture, type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Client-side sanitization
      const extracted = extractMermaidCode(data.diagram);
      const sanitized = sanitizeMermaidCode(extracted);
      console.log('\n========== MERMAID BEFORE VALIDATION ==========');
      console.log(sanitized);
      console.log('==============================================\n');

      // Client-side validation
      const isValid = await validateMermaidSyntax(sanitized);
      if (!isValid) {
        throw new Error('Mermaid syntax validation failed');
      }

      setDiagrams(prev => ({ ...prev, [type]: sanitized }));
      setLoading(false);
    } catch (err) {
      // Log error in the backend console
      fetch('/api/architecture/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: err.message || err.toString(),
          type,
          context: isAutoRetry ? 'Auto-retry generation / validation failure' : 'Initial generation / validation failure'
        })
      }).catch(() => { });

      if (!isAutoRetry) {
        console.warn(`[DiagramView] Validation/generation failed for "${type}". Auto-retrying once...`);
        setRetryFlags(prev => ({ ...prev, [type]: true }));
        // Try again once
        await loadDiagram(type, true);
      } else {
        // Validation/generation failed on retry as well
        setError('Something went wrong.\nPlease try again.');
        setLoading(false);
      }
    }
  };

  const handleRenderFailed = (type, errMsg) => {
    // Log rendering error to backend console
    fetch('/api/architecture/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errMsg,
        type,
        context: 'Frontend render failure'
      })
    }).catch(() => { });

    const alreadyRetried = retryFlags[type];
    if (!alreadyRetried) {
      console.warn(`[DiagramView] Render failed for "${type}". Auto-retrying once...`);
      setRetryFlags(prev => ({ ...prev, [type]: true }));
      // Clear diagram from state to force a new fetch
      setDiagrams(prev => {
        const copy = { ...prev };
        delete copy[type];
        return copy;
      });
      loadDiagram(type, true);
    } else {
      setError('Something went wrong.\nPlease try again.');
    }
  };

  const regenerate = () => {
    setDiagrams(prev => {
      const copy = { ...prev };
      delete copy[activeType];
      return copy;
    });
    // Manual regeneration resets retry count
    setRetryFlags(prev => ({ ...prev, [activeType]: false }));
    loadDiagram(activeType);
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── Diagram type selector ── */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {DIAGRAM_TYPES.map(({ id, label, icon: Icon, desc }) => (
          <motion.button
            key={id}
            onClick={() => loadDiagram(id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all"
            style={{
              background: activeType === id ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeType === id ? 'rgba(37,99,235,0.35)' : 'rgba(255,255,255,0.06)'}`,
              color: activeType === id ? '#93C5FD' : '#6b7280',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={desc}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </motion.button>
        ))}

        {diagrams[activeType] && (
          <button
            onClick={regenerate}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Loading — fetching from API */}
          {loading && (
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center h-full gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
              >
                <EulerLoader className="w-9 h-9" />
              </div>
              <p className="text-gray-500 text-[13px]">Generating diagram…</p>
            </motion.div>
          )}

          {/* API Error */}
          {!loading && error && (
            <motion.div
              key="error"
              className="flex flex-col items-center justify-center h-full gap-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div className="text-center">
                <p className="text-red-400 text-[13px] font-medium mb-1">Something went wrong.</p>
                <p className="text-gray-500 text-[11.5px] leading-relaxed">Please try again.</p>
              </div>
              <button
                onClick={() => loadDiagram(activeType)}
                className="mt-2 text-[12px] px-5 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(37,99,235,0.4)' }}
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* Diagram ready — render it */}
          {!loading && !error && diagrams[activeType] && (
            <motion.div
              key={activeType}
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MermaidRenderer
                code={diagrams[activeType]}
                onRenderFailed={(errMsg) => handleRenderFailed(activeType, errMsg)}
              />
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !error && !diagrams[activeType] && (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center h-full gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <GitBranch className="w-7 h-7 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-[13px] mb-1">Select a diagram type above</p>
                <p className="text-gray-600 text-[11.5px]">AI will generate and render the diagram</p>
              </div>
              <motion.button
                onClick={() => loadDiagram('system')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(59,130,246,0.2))',
                  border: '1px solid rgba(37,99,235,0.3)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GitBranch className="w-4 h-4" />
                Generate System Overview
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
