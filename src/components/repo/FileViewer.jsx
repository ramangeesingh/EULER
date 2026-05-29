import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import hljs from 'highlight.js';

// Map extension → hljs language
const EXT_LANG = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cs: 'csharp', cpp: 'cpp', c: 'c', h: 'c',
  html: 'xml', css: 'css', scss: 'scss',
  json: 'json', yaml: 'yaml', yml: 'yaml',
  md: 'markdown', sql: 'sql', sh: 'bash', bash: 'bash',
  graphql: 'graphql', dockerfile: 'dockerfile',
};

function getLanguage(filePath) {
  const ext = filePath?.split('.').pop().toLowerCase() || '';
  return EXT_LANG[ext] || 'plaintext';
}

function CodeBlock({ content, language }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.removeAttribute('data-highlighted');
      hljs.highlightElement(ref.current);
    }
  }, [content, language]);

  return (
    <pre className="m-0 p-0 bg-transparent overflow-auto">
      <code ref={ref} className={`language-${language} hljs-euler`} style={{ background: 'transparent' }}>
        {content}
      </code>
    </pre>
  );
}

function ExplanationDrawer({ filePath, content, repoSummary, onClose }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setExplanation('');
    setLoading(true);

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/repo/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath, content: content?.slice(0, 15000), repoContext: repoSummary }),
          signal: controller.signal,
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim().startsWith('data: ')) continue;
            const data = line.trim().slice(6);
            if (data === '[DONE]') { setLoading(false); return; }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) setExplanation((p) => p + parsed.content);
            } catch { /* skip */ }
          }
        }
        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setExplanation('Failed to get explanation.');
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [filePath, content, repoSummary]);

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 bottom-0 z-20 flex flex-col"
      style={{
        width: '420px',
        background: 'rgba(8,8,16,0.97)',
        backdropFilter: 'blur(30px)',
        borderLeft: '1px solid rgba(124,58,237,0.2)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">AI Explanation</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll p-5">
        <p className="text-[11px] text-purple-400 font-mono mb-4 opacity-70">{filePath}</p>
        {loading && !explanation && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <motion.div
              className="w-4 h-4 border-2 border-purple-500/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: '#a855f7' }}
            />
            Analyzing file...
          </div>
        )}
        <div className="text-[13.5px] text-gray-300 leading-relaxed whitespace-pre-wrap">
          {explanation}
          {loading && explanation && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-purple-400 ml-0.5 rounded-sm"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function FileViewer({ filePath, content, repoSummary }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const language = getLanguage(filePath);
  const lines = (content || '').split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
        Select a file from the tree to view its contents
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* File header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <span className="text-[13px] font-mono text-gray-300 truncate">{filePath}</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            {language}
          </span>
          <span className="text-[10px] text-gray-600 flex-shrink-0">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            onClick={() => setShowExplanation((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
            style={{
              background: showExplanation ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)',
              border: `1px solid ${showExplanation ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.2)'}`,
              color: '#a78bfa',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showExplanation ? 'Hide Explanation' : 'Explain with AI'}
          </motion.button>

          <motion.button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Code content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 overflow-auto sidebar-scroll relative"
            style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: '13px' }}
          >
            {/* Line numbers */}
            <div className="flex min-h-full">
              <div
                className="py-4 pr-4 pl-4 text-right select-none flex-shrink-0"
                style={{
                  minWidth: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  color: 'rgba(107,114,128,0.5)',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 py-4 pl-4 overflow-x-auto">
                <CodeBlock content={content || ''} language={language} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation drawer */}
      <AnimatePresence>
        {showExplanation && (
          <ExplanationDrawer
            filePath={filePath}
            content={content}
            repoSummary={repoSummary}
            onClose={() => setShowExplanation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
