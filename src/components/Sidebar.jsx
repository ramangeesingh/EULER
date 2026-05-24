import { motion } from 'framer-motion';
import { Plus, Search, FileCode, Settings, Code2, PenSquare, MoreHorizontal } from 'lucide-react';

export default function Sidebar({ chats, activeChat, onNewChat, onSelectChat }) {
  return (
    <motion.aside
      className="h-full w-[340px] shrink-0 glass-sidebar flex flex-col overflow-hidden"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Fixed Top Navigation */}
      <div className="flex-none">
        {/* Logo */}
        <div className="px-8 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-violet-400/95 via-violet-700/95 to-indigo-950 flex items-center justify-center shadow-[0_10px_30px_rgba(20,12,48,0.38)] ring-1 ring-white/[0.08]">
              <Code2 className="w-[22px] h-[22px] text-white/95" />
            </div>
            <span className="text-[26px] leading-none font-medium tracking-[-0.01em] text-white/95">Euler</span>
          </div>
          <motion.button
            className="p-2.5 hover:bg-white/[0.045] rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PenSquare className="w-6 h-6 text-gray-400" />
          </motion.button>
        </div>

        {/* New Chat Button */}
        <div className="px-6 mb-3">
          <motion.button
            onClick={onNewChat}
            className="w-full h-[60px] glass-premium hover:bg-white/[0.05] rounded-2xl px-6 flex items-center gap-5 transition-all text-[17px] font-medium text-white/92 shadow-[0_14px_34px_rgba(0,0,0,0.20)]"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Plus className="w-6 h-6" />
            <span>New Chat</span>
            <span className="ml-auto text-[13px] tracking-[0.08em] text-gray-400">CTRL K</span>
          </motion.button>
        </div>

        {/* Primary Navigation */}
        <nav className="px-7 pb-2 space-y-1.5">
          <motion.button
            className="w-full h-[40px] text-left px-2 rounded-xl hover:bg-white/[0.035] transition-all flex items-center gap-6 text-[16px]"
            whileHover={{ x: 2 }}
          >
            <Search className="w-6 h-6 text-gray-500" />
            <span className="text-gray-300/90">Semantic Search</span>
          </motion.button>

          <motion.button
            className="w-full h-[40px] text-left px-2 rounded-xl hover:bg-white/[0.035] transition-all flex items-center gap-6 text-[16px]"
            whileHover={{ x: 2 }}
          >
            <FileCode className="w-6 h-6 text-gray-500" />
            <span className="text-gray-300/90">Last Opened Files</span>
          </motion.button>

          <motion.button
            className="w-full h-[40px] text-left px-2 rounded-xl hover:bg-white/[0.035] transition-all flex items-center gap-6 text-[16px]"
            whileHover={{ x: 2 }}
          >
            <Settings className="w-6 h-6 text-gray-500" />
            <span className="text-gray-300/90">Settings</span>
          </motion.button>
        </nav>
      </div>

      {/* Flexible Recent Chats Section */}
      <section className="flex-1 min-h-0 px-7 pr-5 flex flex-col">
        <div className="flex-none">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.055] to-transparent mb-4" />
          <div className="text-[11px] uppercase tracking-[0.18em] font-medium text-gray-400/90 mb-2 px-2">
            Recent Chats
          </div>
        </div>

        <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto pr-2">
          {chats.map((chat) => (
            <motion.button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`w-full h-[50px] text-left px-2 rounded-xl transition-colors shadow-[inset_0_-1px_0_rgba(255,255,255,0.018)] ${
                activeChat?.id === chat.id ? 'bg-white/[0.045]' : 'hover:bg-white/[0.03]'
              }`}
              whileHover={{ x: 1 }}
            >
              <div className="flex items-center justify-between gap-5">
                <div className="min-w-0 flex-1 text-gray-300/90 truncate text-[14.5px] leading-5">{chat.title}</div>
                <div className="w-[72px] text-right text-[13px] text-gray-500 shrink-0">{chat.timestamp}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Fixed Bottom Profile */}
      <div className="flex-none px-6 pb-4 pt-3">
        <div className="h-[88px] glass-profile rounded-2xl px-5 flex items-center gap-4">
          <div className="w-[48px] h-[48px] rounded-full bg-gradient-to-br from-violet-400 via-violet-700 to-indigo-950 ring-1 ring-white/[0.12] shadow-[0_12px_32px_rgba(48,26,112,0.42)]" />
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-white/92 leading-6 truncate">Arjun Verma</div>
            <div className="text-[13.5px] text-gray-500 leading-5">Pro Plan</div>
          </div>
          <MoreHorizontal className="w-7 h-7 text-gray-500 ml-auto" />
        </div>
      </div>
    </motion.aside>
  );
}
