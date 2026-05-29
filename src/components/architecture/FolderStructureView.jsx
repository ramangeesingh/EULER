import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, FileCode, ChevronRight } from 'lucide-react';

function FolderNode({ name, value, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = typeof value === 'object' && !Array.isArray(value);

  if (!isDir) {
    // It's a file or description string
    return (
      <div
        className="flex items-center gap-2 py-1 px-2 rounded group"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <FileCode className="w-3.5 h-3.5 shrink-0 text-gray-600" />
        <span className="text-[12.5px] text-gray-400 font-mono">{name}</span>
        {typeof value === 'string' && value && (
          <span className="text-[11px] text-gray-600 ml-2 truncate hidden group-hover:block">{value}</span>
        )}
      </div>
    );
  }

  const children = Object.entries(value);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 py-1 px-2 w-full rounded hover:bg-white/[0.03] transition-colors group"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="w-3 h-3 text-gray-600" />
        </motion.div>
        {open
          ? <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
          : <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
        }
        <span className="text-[12.5px] font-mono font-medium text-gray-300">{name}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children.map(([k, v]) => (
              <FolderNode key={k} name={k} value={v} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderTree({ label, data, color }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      >
        <Folder className="w-4 h-4" style={{ color }} />
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color }}>{label}</span>
      </div>
      <div className="p-2">
        {Object.entries(data || {}).map(([k, v]) => (
          <FolderNode key={k} name={k} value={v} depth={0} />
        ))}
      </div>
    </div>
  );
}

export default function FolderStructureView({ folderStructure = {} }) {
  return (
    <div className="h-full overflow-y-auto sidebar-scroll p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-1">Folder Structure</h2>
        <p className="text-gray-500 text-sm mb-6">Recommended project organization. Click folders to expand/collapse.</p>
        <div className="grid grid-cols-1 gap-4">
          {folderStructure.frontend && (
            <FolderTree label="Frontend" data={folderStructure.frontend} color="#c4b5fd" />
          )}
          {folderStructure.backend && (
            <FolderTree label="Backend / API" data={folderStructure.backend} color="#93c5fd" />
          )}
          {folderStructure.shared && (
            <FolderTree label="Shared / Monorepo" data={folderStructure.shared} color="#6ee7b7" />
          )}
        </div>
      </div>
    </div>
  );
}
