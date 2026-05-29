import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, ChevronDown, ChevronUp,
  Cpu, Cloud, DollarSign, Layers,
} from 'lucide-react';

const SCALE_OPTIONS   = [{ v: 'startup', l: 'Startup', sub: '0–10k users' }, { v: 'medium', l: 'Growth', sub: '10k–1M users' }, { v: 'enterprise', l: 'Enterprise', sub: '1M+ users' }];
const STYLE_OPTIONS   = [{ v: 'monolith', l: 'Monolith' }, { v: 'microservices', l: 'Microservices' }, { v: 'serverless', l: 'Serverless' }, { v: 'hybrid', l: 'Hybrid' }];
const CLOUD_OPTIONS   = [{ v: 'aws', l: 'AWS' }, { v: 'gcp', l: 'GCP' }, { v: 'azure', l: 'Azure' }, { v: 'agnostic', l: 'Agnostic' }];
const BUDGET_OPTIONS  = [{ v: 'low', l: 'Lean', sub: '<$100/mo' }, { v: 'medium', l: 'Standard', sub: '$100–1k/mo' }, { v: 'high', l: 'Scale', sub: '$1k+/mo' }];

const EXAMPLE_PROMPTS = [
  'A real-time collaborative code editor like VS Code in the browser, supporting 1000+ concurrent users',
  'An AI-powered SaaS platform for generating marketing copy with subscription billing and team workspaces',
  'A food delivery app with live order tracking, restaurant management dashboard, and payment processing',
  'An e-learning platform with video courses, live sessions, AI tutoring, and certification system',
  'A social media analytics tool that aggregates data from Twitter, Instagram, and LinkedIn with AI insights',
];

function SelectGroup({ icon: Icon, label, options, value, onChange, hasSubtext }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-2">
        <Icon className="w-3 h-3" />{label}
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className="flex flex-col items-start px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
            style={{
              background: value === o.v ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
              border: value === o.v ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.06)',
              color: value === o.v ? '#c4b5fd' : 'rgba(156,163,175,0.8)',
              boxShadow: value === o.v ? '0 0 12px rgba(124,58,237,0.15)' : 'none',
            }}
          >
            <span>{o.l}</span>
            {hasSubtext && o.sub && <span className="text-[10px] opacity-60 mt-0.5">{o.sub}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ArchPromptPanel({ onGenerate, isGenerating }) {
  const [prompt, setPrompt] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ scale: 'startup', style: 'monolith', cloud: 'aws', budget: 'medium' });
  const [showExamples, setShowExamples] = useState(false);

  const pref = (key) => (val) => setPrefs((p) => ({ ...p, [key]: val }));

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), prefs);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-10 overflow-y-auto sidebar-scroll">
      {/* Hero */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
            boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)',
          }}
        >
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Architecture Engine</h1>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed">
          Describe your app idea and Euler's AI will generate a complete, production-ready software architecture in seconds.
        </p>
      </motion.div>

      {/* Input card */}
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10,10,18,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Textarea */}
          <div className="p-4 pb-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe your app idea in detail... What does it do? Who uses it? What are the main features?"
              className="w-full bg-transparent resize-none text-white placeholder-gray-600 text-[14px] leading-relaxed outline-none"
              style={{ minHeight: '120px' }}
              disabled={isGenerating}
            />
          </div>

          {/* Examples */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowExamples((v) => !v)}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
            >
              {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Example prompts
            </button>
            <AnimatePresence>
              {showExamples && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2 space-y-1.5"
                >
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrompt(ex); setShowExamples(false); }}
                      className="w-full text-left text-[12px] text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all leading-relaxed"
                      style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      "{ex}"
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

          {/* Preferences toggle */}
          <div className="px-4 py-2">
            <button
              onClick={() => setShowPrefs((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPrefs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Architecture preferences
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                {prefs.scale} · {prefs.style} · {prefs.cloud}
              </span>
            </button>

            <AnimatePresence>
              {showPrefs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pb-2 grid grid-cols-2 gap-4">
                    <SelectGroup icon={Layers}     label="Scale"    options={SCALE_OPTIONS}  value={prefs.scale}  onChange={pref('scale')}  hasSubtext />
                    <SelectGroup icon={Cpu}        label="Style"    options={STYLE_OPTIONS}  value={prefs.style}  onChange={pref('style')}  />
                    <SelectGroup icon={Cloud}      label="Cloud"    options={CLOUD_OPTIONS}  value={prefs.cloud}  onChange={pref('cloud')}  />
                    <SelectGroup icon={DollarSign} label="Budget"   options={BUDGET_OPTIONS} value={prefs.budget} onChange={pref('budget')} hasSubtext />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <span className="text-[11px] text-gray-600">
              {prompt.length > 0 ? `${prompt.length} chars · ` : ''}<kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>⌘ Enter</kbd> to generate
            </span>
            <motion.button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
              style={{
                background: prompt.trim() && !isGenerating
                  ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                  : 'rgba(255,255,255,0.06)',
                boxShadow: prompt.trim() && !isGenerating ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                cursor: prompt.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                opacity: !prompt.trim() || isGenerating ? 0.5 : 1,
              }}
              whileHover={prompt.trim() && !isGenerating ? { scale: 1.03 } : {}}
              whileTap={prompt.trim() && !isGenerating ? { scale: 0.97 } : {}}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate Architecture</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {['Tech Stack', 'DB Schema', 'API Routes', 'Auth Flow', 'Folder Structure', 'Deployment', 'Scalability', 'Diagrams'].map((f) => (
            <span
              key={f}
              className="text-[11px] px-2.5 py-1 rounded-full text-gray-500"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
