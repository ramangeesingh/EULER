import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Database, Shield, Rocket, Server, Loader2, RefreshCw, Copy, Check } from 'lucide-react';

const DIAGRAM_TYPES = [
  { id: 'system',       label: 'System Overview',     icon: Server,     desc: 'Frontend → Backend → DB flow' },
  { id: 'sequence',     label: 'Auth Sequence',        icon: Shield,     desc: 'Login & token refresh flow' },
  { id: 'database',     label: 'ER Diagram',           icon: Database,   desc: 'Tables & relationships' },
  { id: 'deployment',   label: 'Deployment Pipeline',  icon: Rocket,     desc: 'Dev → Staging → Production' },
  { id: 'microservices',label: 'Microservices',        icon: GitBranch,  desc: 'Service communication map' },
];

function MermaidDisplay({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple visual rendering of mermaid code as formatted text with color highlighting
  const lines = (code || '').split('\n');

  return (
    <div className="relative h-full flex flex-col">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
          <span className="ml-3 text-[11px] text-gray-600 font-mono">mermaid.diagram</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all"
          style={{
            background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#6ee7b7' : '#9ca3af',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code display */}
      <div className="flex-1 overflow-auto sidebar-scroll p-5">
        <pre className="text-[12px] font-mono leading-[1.7]">
          {lines.map((line, i) => {
            // Color-code mermaid syntax
            const trimmed = line.trim();
            let color = '#d1d5db';
            if (i === 0) color = '#c4b5fd'; // diagram type
            else if (trimmed.startsWith('%%')) color = '#4b5563';
            else if (trimmed.includes('-->') || trimmed.includes('->')) color = '#93c5fd';
            else if (trimmed.includes(':::') || trimmed.startsWith('style')) color = '#fcd34d';
            else if (trimmed.startsWith('subgraph') || trimmed === 'end') color = '#a78bfa';
            else if (trimmed.startsWith('note') || trimmed.startsWith('participant') || trimmed.startsWith('actor')) color = '#6ee7b7';

            return (
              <span key={i} style={{ color, display: 'block' }}>
                {line || '\u00A0'}
              </span>
            );
          })}
        </pre>
      </div>

      {/* Mermaid.js integration note */}
      <div
        className="px-4 py-2 flex-shrink-0 text-[11px] text-gray-600"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        💡 Paste this code into{' '}
        <a href="https://mermaid.live" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 underline">
          mermaid.live
        </a>
        {' '}to render the interactive diagram.
      </div>
    </div>
  );
}

export default function DiagramView({ architecture }) {
  const [activeType, setActiveType] = useState('system');
  const [diagrams, setDiagrams] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDiagram = async (type) => {
    setActiveType(type);
    if (diagrams[type]) return; // cached

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
      setDiagrams((prev) => ({ ...prev, [type]: data.diagram }));
    } catch (err) {
      setError(err.message || 'Failed to generate diagram');
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => {
    setDiagrams((prev) => {
      const copy = { ...prev };
      delete copy[activeType];
      return copy;
    });
    loadDiagram(activeType);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Type selector */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {DIAGRAM_TYPES.map(({ id, label, icon: Icon, desc }) => (
          <motion.button
            key={id}
            onClick={() => loadDiagram(id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all"
            style={{
              background: activeType === id ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeType === id ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)'}`,
              color: activeType === id ? '#c4b5fd' : '#6b7280',
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
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center h-full gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
              </div>
              <p className="text-gray-500 text-sm">Generating diagram...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="flex flex-col items-center justify-center h-full gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-red-400 text-sm">⚠️ {error}</p>
              <button
                onClick={() => loadDiagram(activeType)}
                className="text-[12px] px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Try again
              </button>
            </motion.div>
          ) : diagrams[activeType] ? (
            <motion.div
              key={activeType}
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MermaidDisplay code={diagrams[activeType]} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center h-full gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <GitBranch className="w-7 h-7 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Select a diagram type above</p>
                <p className="text-gray-600 text-xs">AI will generate Mermaid.js diagram code</p>
              </div>
              <button
                onClick={() => loadDiagram('system')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                <GitBranch className="w-4 h-4" />
                Generate System Overview
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
