import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Trash2, Clock, Layers, ChevronRight, Loader2, Plus } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const STYLE_COLORS = {
  startup:     { bg: 'rgba(16,185,129,0.1)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
  medium:      { bg: 'rgba(245,158,11,0.1)',  text: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
  enterprise:  { bg: 'rgba(239,68,68,0.1)',   text: '#fca5a5', border: 'rgba(239,68,68,0.25)' },
  monolith:    { bg: 'rgba(124,58,237,0.1)',  text: '#c4b5fd', border: 'rgba(124,58,237,0.25)' },
  microservices:{ bg: 'rgba(59,130,246,0.1)', text: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
  serverless:  { bg: 'rgba(20,184,166,0.1)',  text: '#5eead4', border: 'rgba(20,184,166,0.25)' },
  hybrid:      { bg: 'rgba(168,85,247,0.1)',  text: '#d8b4fe', border: 'rgba(168,85,247,0.25)' },
};

function Tag({ label }) {
  const c = STYLE_COLORS[label?.toLowerCase()] || STYLE_COLORS.monolith;
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
}

function ArchCard({ item, onLoad, onDelete, index }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/architecture/${item.id}`, { method: 'DELETE' });
      onDelete(item.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ borderColor: 'rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.04)' }}
      onClick={() => onLoad(item)}
    >
      {/* Purple left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: 'linear-gradient(180deg, #7c3aed, #4f46e5)' }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-white truncate">{item.title}</h3>
            <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{item.prompt}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-purple-400 transition-colors mt-0.5 shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {item.preferences?.scale && <Tag label={item.preferences.scale} />}
          {item.preferences?.style && <Tag label={item.preferences.style} />}
          {item.preferences?.cloud && (
            <span className="text-[10px] text-gray-600 font-mono">{item.preferences.cloud.toUpperCase()}</span>
          )}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-gray-600">
            <Clock className="w-3 h-3" />
            {formatDate(item.createdAt)}
          </div>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10"
        title="Delete"
      >
        {deleting
          ? <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
          : <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-400 transition-colors" />
        }
      </button>
    </motion.div>
  );
}

export default function SavedArchitecturesPanel({ onLoad, onNew }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/architecture/saved');
      const data = await res.json();
      setSaved(data.saved || []);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSaved(); }, []);

  const handleDelete = (id) => setSaved((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-purple-400" />
          <span className="text-[13px] font-semibold text-white">Saved Architectures</span>
          {saved.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              {saved.length}
            </span>
          )}
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <p className="text-gray-600 text-sm">Loading saved architectures...</p>
          </div>
        ) : saved.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-60 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Layers className="w-7 h-7 text-gray-700" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">No saved architectures yet</p>
              <p className="text-gray-600 text-xs">Generate one to see it here</p>
            </div>
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <Plus className="w-4 h-4" />
              Generate Architecture
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {saved.map((item, i) => (
                <ArchCard
                  key={item.id}
                  item={item}
                  index={i}
                  onLoad={onLoad}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
