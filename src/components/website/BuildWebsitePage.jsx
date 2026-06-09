import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Monitor, Smartphone, Download, Copy,
  RefreshCw, Plus, Loader2, CheckCircle, Sparkles, Code2,
  Eye, FileCode, Send, Wand2, ChevronRight, LayoutTemplate,
  BarChart2, User, ShoppingBag, BookOpen, Puzzle, History,
  ExternalLink, X, Settings2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SITE_TYPES = [
  { id: 'landing',   label: 'Landing',   icon: LayoutTemplate },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'portfolio', label: 'Portfolio', icon: User },
  { id: 'ecommerce', label: 'E-Commerce',icon: ShoppingBag },
  { id: 'blog',      label: 'Blog',      icon: BookOpen },
  { id: 'component', label: 'Component', icon: Puzzle },
];

const STYLE_THEMES = [
  { id: 'glassmorphism', label: 'Glass' },
  { id: 'modern-dark',   label: 'Dark' },
  { id: 'minimal-light', label: 'Light' },
  { id: 'cyberpunk',     label: 'Cyber' },
  { id: 'pastel',        label: 'Pastel' },
  { id: 'corporate',     label: 'Corp' },
];

const QUICK_PROMPTS = [
  'A SaaS landing page for an AI writing tool with pricing tiers',
  'A crypto dashboard with portfolio charts and live data',
  'A developer portfolio with animated hero and project cards',
  'A minimal e-commerce page for artisan coffee with cart',
  'A modern blog homepage with featured articles grid',
];

const REFINE_SUGGESTIONS = [
  'Make the hero section bigger',
  'Add a pricing section with 3 tiers',
  'Change colors to cyan and dark blue',
  'Add smooth scroll animations',
  'Make it more minimal',
  'Add a testimonials section',
  'Make navigation sticky with blur',
  'Add a footer with social links',
];

const PREVIEW_TABS = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'html',    label: 'HTML',    icon: FileCode },
  { id: 'css',     label: 'CSS',     icon: Code2 },
  { id: 'js',      label: 'JS',      icon: Sparkles },
];

// ─── Left Panel — AI Chat ─────────────────────────────────────────────────────
function LeftPanel({
  messages, input, setInput, isGenerating, isRefining,
  onSend, onGenerate, siteType, setSiteType, style, setStyle,
  showSettings, setShowSettings, onNew, generationCount,
}) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const isIdle = !isGenerating && !isRefining;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || !isIdle) return;
    if (messages.length === 0) {
      onGenerate(text);
    } else {
      onSend(text);
    }
    setInput('');
  };

  const handleQuickPrompt = (p) => {
    setInput(p);
    setShowQuickPrompts(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(6,6,18,0.95)' }}>
      {/* ── Panel header ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
        >
          <Wand2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white leading-none">AI Builder</p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {isEmpty ? 'Describe your website' : `${generationCount} generation${generationCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowSettings(s => !s)}
          className="p-1.5 rounded-lg transition-all"
          style={{
            background: showSettings ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
            color: showSettings ? '#93C5FD' : '#6b7280',
            border: `1px solid ${showSettings ? 'rgba(37,99,235,0.35)' : 'rgba(255,255,255,0.07)'}`,
          }}
          title="Generation settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
        {!isEmpty && (
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-all hover:bg-white/[0.05]"
            title="New website"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Settings panel (collapsible) ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="px-4 py-3 space-y-3">
              {/* Site type */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600 mb-2">Type</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {SITE_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSiteType(id)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-all"
                      style={{
                        background: siteType === id ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)',
                        color: siteType === id ? '#93C5FD' : '#6b7280',
                        border: `1px solid ${siteType === id ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Style */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600 mb-2">Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_THEMES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setStyle(id)}
                      className="px-2.5 py-1 rounded-full text-[11px] transition-all"
                      style={{
                        background: style === id ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)',
                        color: style === id ? '#93C5FD' : '#6b7280',
                        border: `1px solid ${style === id ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages / Empty state ── */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-4 py-4">
        {isEmpty ? (
          <motion.div
            className="h-full flex flex-col justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Welcome */}
            <div className="text-center mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(59,130,246,0.18))',
                  border: '1px solid rgba(37,99,235,0.4)',
                  boxShadow: '0 0 30px rgba(37,99,235,0.2)',
                }}
              >
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-[15px] font-semibold text-white mb-1">Build a Website</h2>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Describe what you want to build and Euler AI will generate it instantly
              </p>
            </div>

            {/* Quick prompts */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Quick start
              </p>
              <div className="space-y-1.5">
                {QUICK_PROMPTS.map((p, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleQuickPrompt(p)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-[12px] text-gray-400 hover:text-white transition-all group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    whileHover={{ borderColor: 'rgba(37,99,235,0.3)', backgroundColor: 'rgba(37,99,235,0.05)' }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                  >
                    <ChevronRight className="w-3 h-3 inline mr-1.5 text-blue-500 group-hover:text-blue-400 transition-colors" />
                    {p}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {/* Refine suggestions after first generation */}
            {messages.length === 1 && !isRefining && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-1"
              >
                <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Refine ideas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {REFINE_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                      className="px-2.5 py-1 rounded-full text-[11px] text-gray-400 hover:text-white transition-all"
                      style={{
                        background: 'rgba(37,99,235,0.07)',
                        border: '1px solid rgba(37,99,235,0.18)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Quick prompts toggle (after first gen) ── */}
      <AnimatePresence>
        {!isEmpty && showQuickPrompts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 px-4 pb-2 overflow-hidden"
          >
            <div className="space-y-1">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p); setShowQuickPrompts(false); textareaRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-gray-400 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <ChevronRight className="w-3 h-3 inline mr-1.5 text-blue-500" />
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="rounded-2xl overflow-hidden transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEmpty
              ? 'Describe your website... (e.g. A SaaS landing page for…)'
              : 'Ask Euler to refine or change something…'}
            rows={2}
            disabled={!isIdle}
            className="w-full resize-none outline-none bg-transparent text-[13px] text-white placeholder-gray-600 px-4 pt-3 pb-1 sidebar-scroll"
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.6, maxHeight: '100px', overflowY: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1">
            {!isEmpty && (
              <button
                onClick={() => setShowQuickPrompts(s => !s)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 transition-colors"
                title="Quick prompts"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex-1" />
            <span className="text-[10px] text-gray-700">↵ Send · ⇧↵ New line</span>
            <motion.button
              onClick={handleSubmit}
              disabled={!input.trim() || !isIdle}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: input.trim() && isIdle
                  ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                  : 'rgba(255,255,255,0.06)',
                boxShadow: input.trim() && isIdle ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                opacity: !input.trim() ? 0.4 : 1,
              }}
              whileHover={input.trim() && isIdle ? { scale: 1.08 } : {}}
              whileTap={input.trim() && isIdle ? { scale: 0.92 } : {}}
            >
              {isGenerating || isRefining
                ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                : <Send className="w-3.5 h-3.5 text-white" />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #2563EB, #3B82F6)', color: '#fff' }
            : { background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }
        }
      >
        {isUser ? 'U' : <Sparkles className="w-3 h-3 text-blue-400" />}
      </div>
      <div
        className="max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed"
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(59,130,246,0.15))',
                border: '1px solid rgba(37,99,235,0.28)',
                borderTopRightRadius: '5px',
                color: '#f3f4f6',
              }
            : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTopLeftRadius: '5px',
                color: '#d1d5db',
              }
        }
      >
        {message.content || (message.isStreaming && (
          <span className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Generating…
          </span>
        ))}
        {message.isStreaming && message.content && (
          <span
            className="inline-block w-0.5 h-3.5 ml-0.5 rounded-full"
            style={{ background: '#60A5FA', animation: 'pulse 1s ease-in-out infinite', verticalAlign: 'middle' }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Right Panel — Preview + Code ─────────────────────────────────────────────
function RightPanel({
  htmlCode, cssCode, jsCode,
  activeTab, setActiveTab,
  device, setDevice,
  siteTitle, isGenerating,
  onCopy, onDownload, copied,
}) {
  const iframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);

  useEffect(() => {
    if (htmlCode && activeTab === 'preview') {
      setIframeLoading(true);
      setIframeKey(k => k + 1);
    }
  }, [htmlCode]);

  const handleOpenBlank = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const codeContent = activeTab === 'html' ? htmlCode
                    : activeTab === 'css'  ? cssCode
                    : activeTab === 'js'   ? jsCode
                    : '';

  const hasContent = !!htmlCode;

  return (
    <div className="h-full flex flex-col" style={{ background: '#080810' }}>
      {/* ── Preview toolbar ── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,4,14,0.9)' }}
      >
        {/* Browser chrome dots */}
        <div className="flex items-center gap-1.5 mr-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,95,87,0.7)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,189,46,0.7)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(40,201,64,0.7)' }} />
        </div>

        {/* Fake URL bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1 rounded-lg mx-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Globe className="w-3 h-3 text-gray-600 shrink-0" />
          <span className="text-[11.5px] text-gray-500 truncate">
            {siteTitle ? `euler://preview — ${siteTitle}` : 'euler://preview'}
          </span>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {PREVIEW_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              disabled={!hasContent}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
              style={{
                background: activeTab === id ? 'rgba(37,99,235,0.22)' : 'transparent',
                color: activeTab === id ? '#93C5FD' : 'rgba(156,163,175,0.6)',
                border: activeTab === id ? '1px solid rgba(37,99,235,0.32)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Device toggle */}
        {activeTab === 'preview' && (
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={() => setDevice('desktop')}
              className="p-1.5 rounded-md transition-all"
              style={{ background: device === 'desktop' ? 'rgba(37,99,235,0.2)' : 'transparent', color: device === 'desktop' ? '#93C5FD' : '#6b7280' }}
              title="Desktop"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className="p-1.5 rounded-md transition-all"
              style={{ background: device === 'mobile' ? 'rgba(37,99,235,0.2)' : 'transparent', color: device === 'mobile' ? '#93C5FD' : '#6b7280' }}
              title="Mobile"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Action buttons */}
        {hasContent && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
              title="Reload"
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
            <button
              onClick={onCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all"
              style={{
                background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                color: copied ? '#4ade80' : '#9ca3af',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Empty/generating state */}
        {!hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {isGenerating ? (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(59,130,246,0.15))',
                    border: '1px solid rgba(37,99,235,0.4)',
                    boxShadow: '0 0 50px rgba(37,99,235,0.3)',
                  }}
                >
                  <Globe className="w-8 h-8 text-blue-400" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-[15px] mb-1">Building your website…</p>
                  <p className="text-gray-500 text-[12px]">Euler AI is crafting your design</p>
                </div>
                <GeneratingSteps />
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <Globe className="w-7 h-7 text-gray-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-[14px] font-medium mb-1">No preview yet</p>
                  <p className="text-gray-600 text-[12px]">Describe your website in the panel and hit Send</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Preview iframe */}
        {hasContent && activeTab === 'preview' && (
          <div
            className="w-full h-full flex items-start justify-center overflow-hidden"
            style={{ background: '#0a0a14', padding: device === 'mobile' ? '20px' : '0' }}
          >
            <motion.div
              className="relative h-full"
              animate={{ width: device === 'mobile' ? '390px' : '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              style={{
                boxShadow: device === 'mobile' ? '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.7)' : 'none',
                borderRadius: device === 'mobile' ? '20px' : '0',
                overflow: 'hidden',
              }}
            >
              <AnimatePresence>
                {iframeLoading && (
                  <motion.div
                    className="absolute inset-0 z-10 flex items-center justify-center"
                    style={{ background: '#0a0a14' }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
              <iframe
                key={iframeKey}
                ref={iframeRef}
                srcDoc={htmlCode}
                onLoad={() => setIframeLoading(false)}
                className="w-full h-full border-0"
                style={{ display: 'block', background: '#fff' }}
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </motion.div>
          </div>
        )}

        {/* Code view */}
        {hasContent && (activeTab === 'html' || activeTab === 'css' || activeTab === 'js') && (
          <div className="w-full h-full overflow-auto sidebar-scroll" style={{ background: '#0a0a14' }}>
            <pre
              className="p-6 text-[12.5px] leading-relaxed min-h-full"
              style={{
                color: '#e5e7eb',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {codeContent || <span className="text-gray-600">No {activeTab.toUpperCase()} content</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generating steps animation ───────────────────────────────────────────────
function GeneratingSteps() {
  const steps = [
    'Analyzing your prompt…',
    'Selecting design aesthetic…',
    'Crafting layout structure…',
    'Writing HTML & semantics…',
    'Styling with CSS…',
    'Adding interactions & JS…',
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col gap-2 w-60">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: i <= step ? 1 : 0.15, x: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          {i < step
            ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
            : i === step
              ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
              : <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
          }
          <span className="text-[12px] transition-colors" style={{ color: i <= step ? '#9ca3af' : '#374151' }}>{s}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Resizable divider ────────────────────────────────────────────────────────
function ResizableDivider({ onDrag }) {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    const onMove = (e) => onDrag(e.clientX);
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="flex-shrink-0 flex items-center justify-center w-1 cursor-col-resize select-none group relative"
      style={{ background: isDragging ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-4 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity absolute"
        style={{ background: 'rgba(37,99,235,0.6)', backdropFilter: 'blur(4px)' }}
      >
        <div className="flex flex-col gap-0.5">
          <div className="w-0.5 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BuildWebsitePage({ onClose }) {
  const containerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(340); // px

  // Generation state
  const [isGenerating, setIsGenerating]     = useState(false);
  const [isRefining, setIsRefining]         = useState(false);
  const [error, setError]                   = useState(null);
  const [generationCount, setGenerationCount] = useState(0);

  // Site state
  const [htmlCode, setHtmlCode]   = useState('');
  const [cssCode, setCssCode]     = useState('');
  const [jsCode, setJsCode]       = useState('');
  const [siteTitle, setSiteTitle] = useState('');

  // UI state
  const [activeTab, setActiveTab]         = useState('preview');
  const [device, setDevice]               = useState('desktop');
  const [copied, setCopied]               = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [siteType, setSiteType]           = useState('landing');
  const [style, setStyle]                 = useState('glassmorphism');

  // Chat messages (includes generation assistant messages)
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const abortRef                  = useRef(null);

  // ── Handle divider drag ──
  const handleDividerDrag = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.min(Math.max(clientX - rect.left, 260), rect.width - 400);
    setLeftWidth(newWidth);
  }, []);

  // ── Generate new website ──
  const handleGenerate = useCallback(async (promptText) => {
    setIsGenerating(true);
    setError(null);
    const userMsg = { role: 'user', content: promptText };
    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };
    setMessages([userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/website/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, style, type: siteType }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');

      setHtmlCode(data.html || '');
      setCssCode(data.css || '');
      setJsCode(data.js || '');
      setSiteTitle(data.title || promptText.slice(0, 40));
      setGenerationCount(c => c + 1);
      setActiveTab('preview');

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: `✅ Website generated! "${data.title || 'Your website'}" is ready.\n\nYou can see the live preview on the right. Ask me to refine anything — change colors, add sections, adjust layouts, or anything else.`,
          isStreaming: false,
        };
        return copy;
      });
    } catch (err) {
      setError(err.message || 'Failed to generate website');
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: `⚠️ Error: ${err.message}`,
          isStreaming: false,
          isError: true,
        };
        return copy;
      });
    } finally {
      setIsGenerating(false);
    }
  }, [style, siteType]);

  // ── Refine existing website via AI chat ──
  const handleSend = useCallback(async (promptText) => {
    setIsRefining(true);
    const userMsg = { role: 'user', content: promptText };
    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const res = await fetch('/api/website/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          currentCode: htmlCode,
          siteTitle,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: fullResponse };
                }
                return copy;
              });
            }
            if (parsed.html) {
              setHtmlCode(parsed.html);
              setActiveTab('preview');
            }
          } catch { /* skip */ }
        }
      }

      // Try to extract code from response if not sent separately
      const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) {
        setHtmlCode(htmlMatch[1]);
        setActiveTab('preview');
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: `⚠️ ${err.message}`, isError: true };
          }
          return copy;
        });
      }
    } finally {
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, isStreaming: false };
        }
        return copy;
      });
      setIsRefining(false);
      abortRef.current = null;
    }
  }, [messages, htmlCode, siteTitle]);

  // ── Copy ──
  const handleCopy = useCallback(() => {
    const code = activeTab === 'html' ? htmlCode
               : activeTab === 'css'  ? cssCode
               : activeTab === 'js'   ? jsCode
               : htmlCode;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeTab, htmlCode, cssCode, jsCode]);

  // ── Download ──
  const handleDownload = useCallback(() => {
    const filename = (siteTitle || 'website').toLowerCase().replace(/\s+/g, '-');
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [htmlCode, siteTitle]);

  // ── New website ──
  const handleNew = () => {
    abortRef.current?.();
    setMessages([]);
    setHtmlCode('');
    setCssCode('');
    setJsCode('');
    setSiteTitle('');
    setError(null);
    setInput('');
    setActiveTab('preview');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(3,3,10,0.99)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── TOP BAR ── */}
      <div
        className="flex items-center gap-3 px-4 h-12 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.5)' }}
      >
        <motion.button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-white text-[12px] transition-colors hover:bg-white/[0.05]"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </motion.button>

        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
          >
            <Globe className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white">Build Website</span>
          {siteTitle && (
            <>
              <span className="text-gray-700 text-[12px]">/</span>
              <span className="text-[12px] text-gray-400 truncate max-w-[240px]">{siteTitle}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Status indicator */}
        {(isGenerating || isRefining) && (
          <motion.div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px]"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: '#93C5FD' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {isGenerating ? 'Generating…' : 'Refining…'}
          </motion.div>
        )}
      </div>

      {/* ── ERROR BANNER ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="flex-shrink-0 mx-4 mt-2 px-4 py-2 rounded-xl text-[12px] text-red-300 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            ⚠️ {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SPLIT WORKSPACE ── */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Left panel */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: `${leftWidth}px` }}>
          <LeftPanel
            messages={messages}
            input={input}
            setInput={setInput}
            isGenerating={isGenerating}
            isRefining={isRefining}
            onSend={handleSend}
            onGenerate={handleGenerate}
            siteType={siteType}
            setSiteType={setSiteType}
            style={style}
            setStyle={setStyle}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            onNew={handleNew}
            generationCount={generationCount}
          />
        </div>

        {/* Resizable divider */}
        <ResizableDivider onDrag={handleDividerDrag} />

        {/* Right panel */}
        <div className="flex-1 overflow-hidden min-w-0">
          <RightPanel
            htmlCode={htmlCode}
            cssCode={cssCode}
            jsCode={jsCode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            device={device}
            setDevice={setDevice}
            siteTitle={siteTitle}
            isGenerating={isGenerating}
            onCopy={handleCopy}
            onDownload={handleDownload}
            copied={copied}
          />
        </div>
      </div>
    </motion.div>
  );
}
