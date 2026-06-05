import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Monitor, Smartphone, Download, Copy,
  RefreshCw, Plus, Loader2, CheckCircle, Sparkles, Code2,
  Eye, FileCode, MessageSquare, Wand2,
} from 'lucide-react';

import WebPromptPanel from './WebPromptPanel';
import PreviewPanel from './PreviewPanel';
import CodeEditorPanel from './CodeEditorPanel';
import WebRefinePanel from './WebRefinePanel';

// ─── Generating overlay ────────────────────────────────────────────────────
function GeneratingOverlay() {
  const steps = [
    'Analyzing your prompt...',
    'Selecting design aesthetic...',
    'Crafting layout structure...',
    'Writing HTML & semantics...',
    'Styling with CSS magic...',
    'Adding interactions & JS...',
    'Polishing final details...',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ background: 'rgba(3,3,10,0.97)', backdropFilter: 'blur(24px)' }}
    >
      {/* Animated orb */}
      <div className="relative mb-10">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235,0.25), rgba(59, 130, 246,0.18))',
            border: '1px solid rgba(37, 99, 235,0.45)',
            boxShadow: '0 0 60px rgba(37, 99, 235,0.4), 0 0 120px rgba(37, 99, 235,0.18)',
          }}
        >
          <Globe className="w-12 h-12 text-blue-400" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
        {/* Orbiting ring 1 */}
        <div
          className="absolute inset-[-12px] rounded-[28px]"
          style={{
            border: '1px solid rgba(37, 99, 235,0.22)',
            animation: 'spin 5s linear infinite',
          }}
        />
        {/* Orbiting ring 2 */}
        <div
          className="absolute inset-[-24px] rounded-[36px]"
          style={{
            border: '1px dashed rgba(37, 99, 235,0.12)',
            animation: 'spin 8s linear infinite reverse',
          }}
        />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Building Your Website</h2>
      <p className="text-gray-500 text-sm mb-10">Euler AI is crafting your design...</p>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-72">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: i <= step ? 1 : 0.18, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {i < step ? (
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            ) : i === step ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full shrink-0" style={{ border: '1px solid rgba(255,255,255,0.12)' }} />
            )}
            <span
              className="text-[13px] transition-colors duration-300"
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

// ─── Tab definitions ───────────────────────────────────────────────────────
const TABS = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'html',    label: 'HTML',    icon: FileCode },
  { id: 'css',     label: 'CSS',     icon: Code2 },
  { id: 'js',      label: 'JS',      icon: Sparkles },
  { id: 'refine',  label: 'Refine (AI)', icon: MessageSquare },
];

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function BuildWebsitePage({ onClose }) {
  const [mode, setMode]               = useState('prompt'); // 'prompt' | 'result'
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState('preview');
  const [device, setDevice]           = useState('desktop'); // 'desktop' | 'mobile'
  const [siteData, setSiteData]       = useState(null);
  // Live-editable code state
  const [htmlCode, setHtmlCode]       = useState('');
  const [cssCode, setCssCode]         = useState('');
  const [jsCode, setJsCode]           = useState('');
  const [copied, setCopied]           = useState(false);

  // ── Generate ──────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (formData) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/website/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');

      setSiteData(data);
      setHtmlCode(data.html || '');
      setCssCode(data.css || '');
      setJsCode(data.js || '');
      setMode('result');
      setActiveTab('preview');
    } catch (err) {
      setError(err.message || 'Failed to generate website');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ── Combined preview HTML ──────────────────────────────────────────────
  // The generated "html" field is already a full document — use it directly
  const previewHtml = htmlCode;

  // ── Copy active tab code ───────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const code = activeTab === 'html' ? htmlCode
                : activeTab === 'css' ? cssCode
                : activeTab === 'js'  ? jsCode
                : htmlCode; // preview tab → copy full html
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeTab, htmlCode, cssCode, jsCode]);

  // ── Download ──────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const filename = (siteData?.title || 'website').toLowerCase().replace(/\s+/g, '-');
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [htmlCode, siteData]);

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleNew = () => {
    setSiteData(null);
    setHtmlCode('');
    setCssCode('');
    setJsCode('');
    setMode('prompt');
    setError(null);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(4,4,12,0.99)', backdropFilter: 'blur(30px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GeneratingOverlay />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.45)' }}
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

        <div className="w-px h-5 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Title */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
          >
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Build Website</span>
          {siteData?.title && mode === 'result' && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400 truncate max-w-[200px]">{siteData.title}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Result-mode controls */}
        {mode === 'result' && (
          <>
            {/* Tabs */}
            <div
              className="flex items-center gap-0.5 p-1 rounded-xl overflow-x-auto"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all"
                  style={{
                    background: activeTab === id ? 'rgba(37, 99, 235,0.22)' : 'transparent',
                    color: activeTab === id ? '#93C5FD' : 'rgba(156,163,175,0.7)',
                    border: activeTab === id ? '1px solid rgba(37, 99, 235,0.32)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Device toggle (only in preview) */}
            {activeTab === 'preview' && (
              <div
                className="flex items-center gap-0.5 p-1 rounded-lg ml-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  onClick={() => setDevice('desktop')}
                  className="p-1.5 rounded-md transition-all"
                  style={{
                    background: device === 'desktop' ? 'rgba(37, 99, 235,0.22)' : 'transparent',
                    color: device === 'desktop' ? '#93C5FD' : 'rgba(156,163,175,0.6)',
                  }}
                  title="Desktop view"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className="p-1.5 rounded-md transition-all"
                  style={{
                    background: device === 'mobile' ? 'rgba(37, 99, 235,0.22)' : 'transparent',
                    color: device === 'mobile' ? '#93C5FD' : 'rgba(156,163,175,0.6)',
                  }}
                  title="Mobile view"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                style={{
                  background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                  color: copied ? '#4ade80' : '#9ca3af',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              <button
                onClick={handleNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          </>
        )}
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

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Prompt panel ── */}
          {mode === 'prompt' && (
            <motion.div
              key="prompt"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WebPromptPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
            </motion.div>
          )}

          {/* ── Result workspace ── */}
          {mode === 'result' && siteData && (
            <motion.div
              key="result"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'preview' && (
                  <motion.div key="preview" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PreviewPanel html={previewHtml} device={device} siteTitle={siteData.title} />
                  </motion.div>
                )}
                {(activeTab === 'html' || activeTab === 'css' || activeTab === 'js') && (
                  <motion.div key="code" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CodeEditorPanel
                      htmlCode={htmlCode}
                      cssCode={cssCode}
                      jsCode={jsCode}
                      activeFile={activeTab}
                      onChangeHtml={setHtmlCode}
                      onChangeCss={setCssCode}
                      onChangeJs={setJsCode}
                    />
                  </motion.div>
                )}
                {activeTab === 'refine' && (
                  <motion.div key="refine" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <WebRefinePanel
                      currentCode={htmlCode}
                      siteTitle={siteData?.title || ''}
                      onApplyCode={(newHtml) => {
                        setHtmlCode(newHtml);
                        setActiveTab('preview');
                      }}
                    />
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
