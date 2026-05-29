import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown,
  FileCode, FileText, FileJson, Folder, FolderOpen,
  Coffee, Globe, Cog, Database,
} from 'lucide-react';

const EXT_ICONS = {
  js: { icon: FileCode, color: '#f0db4f' },
  jsx: { icon: FileCode, color: '#61dafb' },
  ts: { icon: FileCode, color: '#3178c6' },
  tsx: { icon: FileCode, color: '#3178c6' },
  py: { icon: Coffee, color: '#3776ab' },
  json: { icon: FileJson, color: '#f97316' },
  md: { icon: FileText, color: '#9ca3af' },
  css: { icon: Globe, color: '#1572b6' },
  scss: { icon: Globe, color: '#cc6699' },
  html: { icon: Globe, color: '#e34c26' },
  yaml: { icon: Cog, color: '#cb171e' },
  yml: { icon: Cog, color: '#cb171e' },
  sql: { icon: Database, color: '#336791' },
  prisma: { icon: Database, color: '#a855f7' },
};

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  return EXT_ICONS[ext] || { icon: FileText, color: '#9ca3af' };
}

function FileNode({ name, node, path, onSelectFile, selectedFile, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.__type === 'dir';
  const isSelected = !isDir && selectedFile === node.path;
  const { icon: Icon, color } = isDir ? { icon: open ? FolderOpen : Folder, color: '#fbbf24' } : getFileIcon(name);

  return (
    <div>
      <motion.div
        className="flex items-center gap-1.5 px-2 py-[5px] rounded-lg cursor-pointer group"
        style={{
          paddingLeft: `${depth * 14 + 8}px`,
          background: isSelected ? 'rgba(124,58,237,0.15)' : 'transparent',
          borderLeft: isSelected ? '2px solid rgba(124,58,237,0.5)' : '2px solid transparent',
        }}
        whileHover={{ background: isSelected ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)' }}
        onClick={() => {
          if (isDir) setOpen((o) => !o);
          else onSelectFile(node.path);
        }}
      >
        {isDir && (
          <span className="text-gray-500 flex-shrink-0">
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        {!isDir && <span className="w-3" />}
        <Icon className="w-[14px] h-[14px] flex-shrink-0" style={{ color }} />
        <span
          className="text-[12.5px] truncate"
          style={{ color: isSelected ? 'rgba(196,172,255,1)' : 'rgba(209,213,219,0.85)' }}
        >
          {name}
        </span>
        {!isDir && (
          <span className="ml-auto text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0">
            {node.size ? `${(node.size / 1024).toFixed(1)}kb` : ''}
          </span>
        )}
      </motion.div>

      {isDir && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {Object.entries(node.children || {})
                .sort(([an, av], [bn, bv]) => {
                  // Dirs first
                  if (av.__type === 'dir' && bv.__type !== 'dir') return -1;
                  if (av.__type !== 'dir' && bv.__type === 'dir') return 1;
                  return an.localeCompare(bn);
                })
                .map(([childName, childNode]) => (
                  <FileNode
                    key={childName}
                    name={childName}
                    node={childNode}
                    path={`${path}/${childName}`}
                    onSelectFile={onSelectFile}
                    selectedFile={selectedFile}
                    depth={depth + 1}
                  />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function FileTreePanel({ tree, onSelectFile, selectedFile, repoName }) {
  return (
    <div className="h-full flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-purple-400" />
          <span className="text-[12px] font-semibold text-gray-300 truncate">{repoName || 'Repository'}</span>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-2 px-1">
        {Object.entries(tree || {})
          .sort(([an, av], [bn, bv]) => {
            if (av.__type === 'dir' && bv.__type !== 'dir') return -1;
            if (av.__type !== 'dir' && bv.__type === 'dir') return 1;
            return an.localeCompare(bn);
          })
          .map(([name, node]) => (
            <FileNode
              key={name}
              name={name}
              node={node}
              path={name}
              onSelectFile={onSelectFile}
              selectedFile={selectedFile}
              depth={0}
            />
          ))}
      </div>
    </div>
  );
}
