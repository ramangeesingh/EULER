import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Code2, PanelLeftClose, LogOut, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  chats = [],
  activeChat,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  isOpen,
  onToggle,
}) {
  const { user, signOut } = useAuth();
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const displayName  = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'U';
  // Google OAuth stores the profile picture in avatar_url or picture
  const avatarUrl    = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const handleStartEdit = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleSaveEdit = (e, chatId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat?.(chatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e, chatId);
    } else if (e.key === 'Escape') {
      handleCancelEdit(e);
    }
  };

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
              <img
                src="/euler-logo.jpg"
                alt="Euler Logo"
                className="w-11 h-11 rounded-xl object-cover shrink-0"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 16px rgba(37, 99, 235,0.2)'
                }}
              />
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
          <div className="px-3 mb-3">
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

          {/* ── Divider ── */}
          <div className="mx-4 mb-3 h-px bg-white/[0.04]" />

          {/* ── Recent Chats ── */}
          <div className="px-4 mb-2">
            <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-gray-500/80">Recent Chats</span>
          </div>

          <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3 space-y-1">
            {chats.map((chat) => {
              const isEditing = editingChatId === chat.id;
              const isActive = activeChat?.id === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`chat-item-container relative group rounded-lg transition-all ${
                    isActive ? 'chat-item-active bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-2 w-full">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, chat.id)}
                        className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-0.5 text-[12.5px] text-white outline-none focus:border-blue-500/50 transition-colors"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => handleSaveEdit(e, chat.id)}
                        className="p-1 rounded hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => onSelectChat?.(chat)}
                      className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer w-full text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-300/85 truncate text-[13px] leading-[1.4] group-hover:text-white transition-colors">
                          {chat.title}
                        </div>
                        {chat.timestamp && (
                          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                            {chat.timestamp}
                          </div>
                        )}
                      </div>

                      {/* Actions displayed on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <button
                          onClick={(e) => handleStartEdit(e, chat)}
                          className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-colors"
                          title="Rename chat"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this chat?')) {
                              onDeleteChat?.(chat.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-rose-400 transition-colors"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Profile ── */}
          <div className="px-3 pb-4 pt-2">
            <div className="glass-profile rounded-xl px-3 flex items-center gap-2.5 group" style={{ height: '60px' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-[34px] h-[34px] rounded-full shrink-0 object-cover"
                  style={{ boxShadow: '0 4px 14px rgba(37, 99, 235,0.35)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                />
              ) : (
                <div
                  className="w-[34px] h-[34px] rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-semibold"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)', boxShadow: '0 4px 14px rgba(37, 99, 235,0.4)' }}
                >
                  {avatarLetter}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white/90 truncate leading-5">{displayName}</div>
                <div className="text-[11px] text-gray-500 leading-4 truncate">{displayEmail}</div>
              </div>
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
