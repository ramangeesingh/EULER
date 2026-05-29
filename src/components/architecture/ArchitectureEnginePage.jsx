import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Cpu, LayoutDashboard, Layers, FolderTree,
  Database, Shield, Rocket, GitBranch, MessageSquare,
  BookMarked, Plus, Loader2, Download, RefreshCw, CheckCircle,
} from 'lucide-react';

import ArchPromptPanel       from './ArchPromptPanel';
import OverviewPanel         from './OverviewPanel';
import StackView             from './StackView';
import FolderStructureView   from './FolderStructureView';
import DatabaseView          from './DatabaseView';
import AuthView              from './AuthView';
import DeploymentView        from './DeploymentView';
import DiagramView           from './DiagramView';
import ArchChatPanel         from './ArchChatPanel';
import SavedArchitecturesPanel from './SavedArchitecturesPanel';

// ─── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard, color: '#c4b5fd' },
  { id: 'stack',       label: 'Stack',       icon: Layers,          color: '#93c5fd' },
  { id: 'folders',     label: 'Folders',     icon: FolderTree,      color: '#fcd34d' },
  { id: 'database',    label: 'DB & API',    icon: Database,        color: '#6ee7b7' },
  { id: 'auth',        label: 'Auth',        icon: Shield,          color: '#fca5a5' },
  { id: 'deployment',  label: 'Deployment',  icon: Rocket,          color: '#86efac' },
  { id: 'diagrams',    label: 'Diagrams',    icon: GitBranch,       color: '#a5b4fc' },
  { id: 'chat',        label: 'Refine (AI)', icon: MessageSquare,   color: '#f9a8d4' },
];

// ─── Loading overlay ─────────────────────────────────────────────────────────
function GeneratingOverlay() {
  const steps = [
    'Analyzing your requirements...',
    'Selecting optimal tech stack...',
    'Designing database schema...',
    'Planning API architecture...',
    'Mapping authentication flows...',
    'Configuring deployment strategy...',
    'Finalizing scalability plan...',
  ];
  const [step, setStep] = useState(0);

  useState(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1800);
    return () => clearInterval(t);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(4,4,10,0.97)', backdropFilter: 'blur(20px)' }}>
      {/* Animated orb */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
            border: '1px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 60px rgba(124,58,237,0.35), 0 0 120px rgba(124,58,237,0.15)',
          }}
        >
          <Cpu className="w-12 h-12 text-purple-400 animate-pulse" />
        </div>
        {/* Orbiting ring */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            border: '1px solid rgba(124,58,237,0.2)',
            animation: 'spin 4s linear infinite',
            background: 'transparent',
          }}
        />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Generating Architecture</h2>
      <p className="text-gray-500 text-sm mb-8">Euler AI is designing your system...</p>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-72">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {i < step ? (
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            ) : i === step ? (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full shrink-0" style={{ border: '1px solid rgba(255,255,255,0.12)' }} />
            )}
            <span
              className="text-[13px] transition-colors"
              style={{ color: i <= step ? '#d1d5db' : '#374151' }}
            >
              {s}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ArchitectureEnginePage({ onClose }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'result' | 'saved'
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [archData, setArchData] = useState(null); // { id, architecture, title, prompt }
  const [savedKey, setSavedKey] = useState(0); // force re-render saved panel

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (prompt, preferences) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/architecture/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, preferences }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');
      setArchData({ id: data.id, architecture: data.architecture, title: data.architecture?.overview?.appName || 'Architecture', prompt });
      setMode('result');
      setActiveTab('overview');
    } catch (err) {
      setError(err.message || 'Failed to generate architecture');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ── Load saved ────────────────────────────────────────────────────────────
  const handleLoadSaved = useCallback(async (item) => {
    try {
      const res = await fetch(`/api/architecture/${item.id}`);
      const data = await res.json();
      setArchData({ id: data.id, architecture: data.architecture, title: data.title, prompt: data.prompt });
      setMode('result');
      setActiveTab('overview');
    } catch {
      // fallback — use item data directly
      setArchData({ id: item.id, architecture: null, title: item.title, prompt: item.prompt });
      setMode('prompt');
    }
  }, []);

  // ── Export JSON ───────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!archData) return;
    const blob = new Blob([JSON.stringify(archData.architecture, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(archData.title || 'architecture').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const arch = archData?.architecture || {};

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(5,5,12,0.99)', backdropFilter: 'blur(30px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GeneratingOverlay />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)' }}
      >
        {/* Back */}
        <motion.button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-sm transition-colors hover:bg-white/[0.05]"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Title */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Cpu className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Architecture Engine</span>
          {archData?.title && mode === 'result' && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400 truncate max-w-[200px]">{archData.title}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Tabs (when showing result) */}
        {mode === 'result' && (
          <div
            className="flex items-center gap-0.5 p-1 rounded-xl overflow-x-auto"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {TABS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all"
                style={{
                  background: activeTab === id ? 'rgba(124,58,237,0.22)' : 'transparent',
                  color: activeTab === id ? color : 'rgba(156,163,175,0.7)',
                  border: activeTab === id ? '1px solid rgba(124,58,237,0.32)' : '1px solid transparent',
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-2">
          {mode === 'result' && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
                title="Export JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={() => { setMode('prompt'); setArchData(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </>
          )}
          <button
            onClick={() => setMode(mode === 'saved' ? (archData ? 'result' : 'prompt') : 'saved')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
            style={{
              background: mode === 'saved' ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
              color: mode === 'saved' ? '#c4b5fd' : '#9ca3af',
              border: `1px solid ${mode === 'saved' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Saved
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="flex-shrink-0 mx-4 mt-3 px-4 py-2.5 rounded-xl text-sm text-red-300 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            ⚠️ {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-300">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Saved panel ── */}
          {mode === 'saved' && (
            <motion.div
              key="saved"
              className="h-full max-w-2xl mx-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              <SavedArchitecturesPanel
                key={savedKey}
                onLoad={handleLoadSaved}
                onNew={() => { setMode('prompt'); setArchData(null); }}
              />
            </motion.div>
          )}

          {/* ── Prompt panel ── */}
          {mode === 'prompt' && (
            <motion.div
              key="prompt"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <ArchPromptPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
            </motion.div>
          )}

          {/* ── Result dashboard ── */}
          {mode === 'result' && archData && (
            <motion.div
              key="result"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div key="ov" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <OverviewPanel architecture={arch} />
                  </motion.div>
                )}
                {activeTab === 'stack' && (
                  <motion.div key="st" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <StackView stack={arch.stack} />
                  </motion.div>
                )}
                {activeTab === 'folders' && (
                  <motion.div key="fl" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FolderStructureView folderStructure={arch.folderStructure} />
                  </motion.div>
                )}
                {activeTab === 'database' && (
                  <motion.div key="db" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DatabaseView database={arch.database} api={arch.api} />
                  </motion.div>
                )}
                {activeTab === 'auth' && (
                  <motion.div key="au" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AuthView authentication={arch.authentication} security={arch.security} />
                  </motion.div>
                )}
                {activeTab === 'deployment' && (
                  <motion.div key="dp" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DeploymentView deployment={arch.deployment} scalability={arch.scalability} />
                  </motion.div>
                )}
                {activeTab === 'diagrams' && (
                  <motion.div key="dg" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DiagramView architecture={arch} />
                  </motion.div>
                )}
                {activeTab === 'chat' && (
                  <motion.div key="ch" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ArchChatPanel architecture={arch} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
