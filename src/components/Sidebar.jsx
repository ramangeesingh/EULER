import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileCode, Settings, Code2, MoreHorizontal, PanelLeftClose, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ chats, activeChat, onNewChat, onSelectChat, isOpen, onToggle }) {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'U';

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          className="h-full shrink-0 glass-sidebar flex flex-col overflow-hidden"
          style={{ width: '238px' }}
          initial={{ x: -238, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -238, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Logo row ── */}
          <div className="flex items-center justify-between px-5 pt-[18px] pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-[34px] h-[34px] rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 4px 16px rgba(124,58,237,0.45)' }}
              >
                <Code2 className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="text-[20px] font-semibold tracking-[-0.01em] text-white">Euler</span>
            </div>
            <motion.button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-white/[0.07] transition-colors group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Close sidebar"
            >
              <PanelLeftClose className="w-[18px] h-[18px] text-gray-500 group-hover:text-gray-300 transition-colors" />
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
            <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-gray-500/80">Recent Chats</span>
          </div>

          <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3 space-y-0.5">
            {chats.map((chat) => (
              <motion.button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`chat-item w-full text-left px-3 rounded-lg transition-colors ${activeChat?.id === chat.id ? 'chat-item-active' : ''}`}
                style={{ minHeight: '44px', paddingTop: '9px', paddingBottom: '9px' }}
                whileHover={{ x: 1 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-300/85 truncate text-[13px] leading-[1.4]">{chat.title}</span>
                  <span className="text-[11px] text-gray-600 shrink-0 whitespace-nowrap">{chat.timestamp}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* ── Profile ── */}
          <div className="px-3 pb-4 pt-2">
            <div className="glass-profile rounded-xl px-3 flex items-center gap-2.5 group" style={{ height: '60px' }}>
              {/* Avatar initial */}
              <div
                className="w-[34px] h-[34px] rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
              >
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white/90 truncate leading-5">{displayName}</div>
                <div className="text-[11px] text-gray-500 leading-4 truncate">{displayEmail}</div>
              </div>
              {/* Sign out — visible on hover */}
              <motion.button
                onClick={signOut}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/[0.07] transition-all shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign out"
              >
                <LogOut className="w-[15px] h-[15px] text-gray-500 hover:text-red-400 transition-colors" />
              </motion.button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
