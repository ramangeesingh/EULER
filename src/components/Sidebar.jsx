import { motion } from 'framer-motion';
import { Plus, Search, FileCode, Settings, Code2, PenSquare, MoreHorizontal } from 'lucide-react';

export default function Sidebar({ chats, activeChat, onNewChat, onSelectChat }) {
  return (
    <motion.aside
      className="h-full shrink-0 glass-sidebar flex flex-col overflow-hidden"
      style={{ width: '238px' }}
      initial={{ x: -238, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Logo row ── */}
      <div className="flex items-center justify-between px-5 pt-[18px] pb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-[34px] h-[34px] rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.45)',
            }}
          >
            <Code2 className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-[20px] font-semibold tracking-[-0.01em] text-white">Euler</span>
        </div>
        <motion.button
          className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PenSquare className="w-[18px] h-[18px] text-gray-500" />
        </motion.button>
      </div>

      {/* ── New Chat button ── */}
      <div className="px-3 mb-2">
        <motion.button
          onClick={onNewChat}
          className="new-chat-btn w-full rounded-xl px-4 flex items-center gap-3 text-[14px] font-medium text-white/85"
          style={{ height: '44px' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-[18px] h-[18px]" />
          <span>New Chat</span>
          <span className="ml-auto text-[11px] tracking-[0.06em] text-gray-500">⌘ K</span>
        </motion.button>
      </div>

      {/* ── Primary nav ── */}
      <nav className="px-3 pb-1 space-y-0.5">
        {[
          { icon: Search, label: 'Semantic Search' },
          { icon: FileCode, label: 'Last Opened Files' },
          { icon: Settings, label: 'Settings' },
        ].map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            className="w-full h-[38px] text-left px-3 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center gap-3 text-[13.5px]"
            whileHover={{ x: 1 }}
          >
            <Icon className="w-[17px] h-[17px] text-gray-500 shrink-0" />
            <span className="text-gray-400">{label}</span>
          </motion.button>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 my-3 h-px bg-white/[0.04]" />

      {/* ── Recent Chats ── */}
      <div className="px-4 mb-2">
        <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-gray-500/80">
          Recent Chats
        </span>
      </div>

      <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3 space-y-0.5">
        {chats.map((chat) => (
          <motion.button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`chat-item w-full text-left px-3 rounded-lg transition-colors ${
              activeChat?.id === chat.id ? 'chat-item-active' : ''
            }`}
            style={{ minHeight: '44px', paddingTop: '9px', paddingBottom: '9px' }}
            whileHover={{ x: 1 }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-300/85 truncate text-[13px] leading-[1.4]">
                {chat.title}
              </span>
              <span className="text-[11px] text-gray-600 shrink-0 whitespace-nowrap">
                {chat.timestamp}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Profile ── */}
      <div className="px-3 pb-4 pt-2">
        <div
          className="glass-profile rounded-xl px-4 flex items-center gap-3"
          style={{ height: '60px' }}
        >
          {/* Avatar */}
          <div
            className="w-[34px] h-[34px] rounded-full shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
            }}
          />
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white/90 truncate leading-5">
              Arjun Verma
            </div>
            <div className="text-[12px] text-gray-500 leading-4">Pro Plan</div>
          </div>
          <MoreHorizontal className="w-[18px] h-[18px] text-gray-600 ml-auto shrink-0" />
        </div>
      </div>
    </motion.aside>
  );
}
