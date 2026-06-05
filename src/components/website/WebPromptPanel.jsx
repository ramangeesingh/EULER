import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sparkles, Zap, LayoutTemplate, BarChart2,
  User, ShoppingBag, BookOpen, Puzzle, ChevronRight,
  Wand2, Send,
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────
const SITE_TYPES = [
  { id: 'landing',   label: 'Landing Page',   icon: LayoutTemplate, color: '#60A5FA', desc: 'Marketing & hero' },
  { id: 'dashboard', label: 'Dashboard',      icon: BarChart2,      color: '#67e8f9', desc: 'Admin & analytics' },
  { id: 'portfolio', label: 'Portfolio',      icon: User,           color: '#fcd34d', desc: 'Showcase work' },
  { id: 'ecommerce', label: 'E-Commerce',     icon: ShoppingBag,    color: '#86efac', desc: 'Products & shop' },
  { id: 'blog',      label: 'Blog',           icon: BookOpen,       color: '#f9a8d4', desc: 'Articles & posts' },
  { id: 'component', label: 'Component',      icon: Puzzle,         color: '#fca5a5', desc: 'UI elements' },
];

const STYLE_THEMES = [
  { id: 'glassmorphism', label: 'Glassmorphism', preview: 'linear-gradient(135deg, rgba(37, 99, 235,0.4), rgba(59, 130, 246,0.2))', border: '#2563EB' },
  { id: 'modern-dark',   label: 'Modern Dark',   preview: 'linear-gradient(135deg, #0f172a, #1e293b)',                         border: '#3b82f6' },
  { id: 'minimal-light', label: 'Minimal Light', preview: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',                         border: '#6366f1' },
  { id: 'cyberpunk',     label: 'Cyberpunk',     preview: 'linear-gradient(135deg, #0a0010, #1a0030)',                         border: '#00ffff' },
  { id: 'pastel',        label: 'Pastel',        preview: 'linear-gradient(135deg, #fdf4ff, #f0f9ff)',                         border: '#c084fc' },
  { id: 'corporate',     label: 'Corporate',     preview: 'linear-gradient(135deg, #1e3a5f, #0f172a)',                         border: '#2563eb' },
];

const ACCENT_COLORS = [
  '#2563EB', '#3B82F6', '#0891b2', '#059669', '#d97706', '#dc2626',
];

const EXAMPLE_PROMPTS = [
  'A SaaS landing page for an AI writing tool with pricing tiers and feature highlights',
  'A crypto trading dashboard with portfolio charts and live market data',
  'A developer portfolio with animated hero, project cards, and skills section',
  'A minimal e-commerce page for artisan coffee with product cards and cart',
  'A modern blog homepage for a tech publication with featured articles',
  'A glassmorphism card component library with buttons, inputs, and modals',
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function WebPromptPanel({ onGenerate, isGenerating }) {
  const [prompt, setPrompt]           = useState('');
  const [siteType, setSiteType]       = useState('landing');
  const [style, setStyle]             = useState('glassmorphism');
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [features, setFeatures]       = useState({
    responsive: true,
    animations: true,
    darkMode: false,
    navigation: true,
  });
  const [showExamples, setShowExamples] = useState(false);

  const toggleFeature = (key) => setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({ prompt: prompt.trim(), style, type: siteType, accentColor, features });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full overflow-y-auto sidebar-scroll">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235,0.25), rgba(59, 130, 246,0.18))',
              border: '1px solid rgba(37, 99, 235,0.4)',
              boxShadow: '0 0 40px rgba(37, 99, 235,0.25)',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Globe className="w-8 h-8 text-blue-400" />
          </motion.div>

          <motion.h1
            className="text-3xl font-bold text-white mb-2 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Build Website
          </motion.h1>
          <motion.p
            className="text-gray-500 text-[15px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Describe your website and Euler AI will generate it instantly
          </motion.p>
        </div>

        {/* ── Prompt input ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] uppercase tracking-[0.1em] font-medium text-gray-500">
              Describe your website
            </label>
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Examples
            </button>
          </div>

          <AnimatePresence>
            {showExamples && (
              <motion.div
                className="mb-3 grid grid-cols-1 gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { setPrompt(ex); setShowExamples(false); }}
                    className="text-left px-3 py-2.5 rounded-xl text-[13px] text-gray-300 hover:text-white transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                    whileHover={{ borderColor: 'rgba(37, 99, 235,0.3)', backgroundColor: 'rgba(37, 99, 235,0.06)' }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ChevronRight className="w-3 h-3 inline mr-1.5 text-blue-400" />
                    {ex}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. A SaaS landing page for an AI writing assistant with a hero section, feature highlights, pricing tiers, and testimonials..."
              rows={4}
              className="w-full resize-none text-[14px] text-white placeholder-gray-600 outline-none transition-all pr-12"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '14px',
                padding: '14px 16px',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.6,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(37, 99, 235,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <motion.button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: prompt.trim() ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : 'rgba(255,255,255,0.1)',
                color: prompt.trim() ? '#ffffff' : '#6b7280',
                cursor: !prompt.trim() || isGenerating ? 'not-allowed' : 'pointer',
                opacity: !prompt.trim() ? 0.5 : 1,
              }}
              whileHover={prompt.trim() ? { scale: 1.05 } : {}}
              whileTap={prompt.trim() ? { scale: 0.95 } : {}}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5 text-right">Press Enter to send • Shift + Enter for new line</p>
        </motion.div>

        {/* ── Site Type ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <label className="block text-[12px] uppercase tracking-[0.1em] font-medium text-gray-500 mb-3">
            Site Type
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {SITE_TYPES.map(({ id, label, icon: Icon, color, desc }) => (
              <button
                key={id}
                onClick={() => setSiteType(id)}
                className="relative flex flex-col items-start gap-2 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  background: siteType === id ? `${color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${siteType === id ? color + '50' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: siteType === id ? `0 0 20px ${color}15` : 'none',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white">{label}</div>
                  <div className="text-[11px] text-gray-500">{desc}</div>
                </div>
                {siteType === id && (
                  <div
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Style Theme ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-[12px] uppercase tracking-[0.1em] font-medium text-gray-500 mb-3">
            Design Style
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {STYLE_THEMES.map(({ id, label, preview, border }) => (
              <button
                key={id}
                onClick={() => setStyle(id)}
                className="relative overflow-hidden rounded-xl transition-all text-left"
                style={{
                  border: `1.5px solid ${style === id ? border : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: style === id ? `0 0 16px ${border}30` : 'none',
                }}
              >
                {/* Color preview strip */}
                <div
                  className="h-[36px] w-full"
                  style={{ background: preview }}
                />
                <div
                  className="px-3 py-2"
                  style={{ background: style === id ? `${border}15` : 'rgba(0,0,0,0.4)' }}
                >
                  <span className="text-[12px] font-medium" style={{ color: style === id ? '#fff' : '#9ca3af' }}>
                    {label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Accent Color + Features row ── */}
        <motion.div
          className="flex gap-4 mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          {/* Accent color */}
          <div className="flex-1">
            <label className="block text-[12px] uppercase tracking-[0.1em] font-medium text-gray-500 mb-3">
              Accent Color
            </label>
            <div className="flex gap-2.5">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: color,
                    boxShadow: accentColor === color ? `0 0 0 2.5px rgba(255,255,255,0.9), 0 0 12px ${color}80` : `0 0 0 2px transparent`,
                    transform: accentColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="flex-1">
            <label className="block text-[12px] uppercase tracking-[0.1em] font-medium text-gray-500 mb-3">
              Features
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries({ responsive: 'Responsive', animations: 'Animations', darkMode: 'Dark Mode', navigation: 'Navigation' }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleFeature(key)}
                  className="px-3 py-1 rounded-full text-[12px] transition-all"
                  style={{
                    background: features[key] ? 'rgba(37, 99, 235,0.2)' : 'rgba(255,255,255,0.04)',
                    color: features[key] ? '#93C5FD' : '#6b7280',
                    border: `1px solid ${features[key] ? 'rgba(37, 99, 235,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  {features[key] ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── CTA Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <motion.button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-[15px] font-semibold text-white relative overflow-hidden"
            style={{
              background: !prompt.trim()
                ? 'rgba(37, 99, 235,0.3)'
                : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 60%, #6366f1 100%)',
              boxShadow: prompt.trim() ? '0 4px 32px rgba(37, 99, 235,0.5), 0 0 64px rgba(37, 99, 235,0.2)' : 'none',
              opacity: !prompt.trim() ? 0.6 : 1,
              cursor: !prompt.trim() || isGenerating ? 'not-allowed' : 'pointer',
            }}
            whileHover={prompt.trim() ? { scale: 1.01, boxShadow: '0 6px 40px rgba(37, 99, 235,0.6)' } : {}}
            whileTap={prompt.trim() ? { scale: 0.98 } : {}}
          >
            {/* Shimmer overlay */}
            {prompt.trim() && (
              <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                  animation: 'shimmer 2.5s infinite',
                }}
              />
            )}
            <Wand2 className="w-5 h-5" />
            Generate Website
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
