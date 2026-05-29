import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileCode } from 'lucide-react';

export default function SearchPanel({ files }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/repo/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, files }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [files]);

  const handleKey = (e) => {
    if (e.key === 'Enter') doSearch(query);
  };

  // Highlight matched text
  function highlight(text, q) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(168,85,247,0.3)', color: '#c4b5fd', borderRadius: '3px', padding: '0 2px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  // Group results by file
  const grouped = results?.reduce((acc, r) => {
    if (!acc[r.file]) acc[r.file] = [];
    acc[r.file].push(r);
    return acc;
  }, {}) ?? {};

  return (
    <div className="h-full flex flex-col">
      {/* Search input */}
      <div
        className="p-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="flex items-center gap-3 rounded-xl px-4 h-11"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search across all files... (Enter)"
            className="flex-1 bg-transparent text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); }}>
              <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </button>
          )}
          <motion.button
            onClick={() => doSearch(query)}
            className="px-3 py-1 rounded-lg text-[12px] font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Search
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-4">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <motion.div
              className="w-4 h-4 border-2 border-purple-500/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: '#a855f7' }}
            />
            Searching...
          </div>
        )}

        {!loading && results === null && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Search className="w-10 h-10 text-gray-700" />
            <div>
              <p className="text-gray-400 text-sm font-medium">Search your codebase</p>
              <p className="text-gray-600 text-xs mt-1">Find functions, variables, strings, and more</p>
            </div>
          </div>
        )}

        {!loading && results !== null && results.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">No results found for "{query}"</p>
        )}

        <AnimatePresence>
          {!loading && results !== null && results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-[11px] text-gray-500">
                {results.length} match{results.length !== 1 ? 'es' : ''} in {Object.keys(grouped).length} file{Object.keys(grouped).length !== 1 ? 's' : ''}
              </p>

              {Object.entries(grouped).map(([file, matches]) => (
                <motion.div
                  key={file}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* File header */}
                  <div
                    className="flex items-center gap-2 px-4 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <FileCode className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="text-[12px] font-mono text-gray-300 truncate">{file}</span>
                    <span
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}
                    >
                      {matches.length}
                    </span>
                  </div>

                  {/* Match rows */}
                  {matches.map((match, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-3 px-4 py-2.5"
                      style={{ borderBottom: j < matches.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                    >
                      <span className="text-[11px] font-mono text-gray-600 flex-shrink-0 pt-0.5 w-8 text-right">
                        {match.line}
                      </span>
                      <code className="text-[12px] font-mono text-gray-300 break-all leading-5">
                        {highlight(match.content, query)}
                      </code>
                    </div>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
