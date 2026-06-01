import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bot, Plus, Trash2, MessageSquare,
  ChevronRight, Clock, Sparkles,
} from 'lucide-react';

import DevChatPanel from './DevChatPanel';

// ─── localStorage helpers ──────────────────────────────────────────────────
const STORAGE_KEY = 'euler_devassistant_conversations';

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 30))); // keep max 30
  } catch { /* storage full — ignore */ }
}

function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function newConversation() {
  return { id: generateId(), title: 'New conversation', createdAt: Date.now(), messages: [] };
}

// ─── Relative time formatter ───────────────────────────────────────────────
function relativeTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)       return 'just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ─── Conversation list sidebar ─────────────────────────────────────────────
function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div
      className="h-full flex flex-col flex-shrink-0"
      style={{ width: '240px', background: 'rgba(0,0,0,0.35)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-3 flex-shrink-0">
        <motion.button
          onClick={onNew}
          className="w-full h-10 rounded-xl flex items-center gap-2.5 px-3.5 text-[13px] font-medium text-white/85 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.12))',
            border: '1px solid rgba(124,58,237,0.3)',
          }}
          whileHover={{ scale: 1.01, borderColor: 'rgba(124,58,237,0.5)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4 text-purple-400" />
          New Conversation
        </motion.button>
      </div>

      {/* Section label */}
      <div className="px-4 pb-1.5">
        <span className="text-[10.5px] uppercase tracking-[0.13em] font-medium text-gray-600">
          History
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-3 space-y-0.5">
        <AnimatePresence initial={false}>
          {conversations.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center py-10 text-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <MessageSquare className="w-7 h-7 text-gray-700 mb-3" />
              <p className="text-[12px] text-gray-600 leading-relaxed">
                No conversations yet.<br />Start one above!
              </p>
            </motion.div>
          )}
          {conversations.map((conv) => (
            <motion.div
              key={conv.id}
              className="relative group"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onHoverStart={() => setHoveredId(conv.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <button
                onClick={() => onSelect(conv.id)}
                className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: activeId === conv.id
                    ? 'rgba(124,58,237,0.14)'
                    : hoveredId === conv.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: `1px solid ${activeId === conv.id ? 'rgba(124,58,237,0.25)' : 'transparent'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{ color: activeId === conv.id ? '#a78bfa' : '#4b5563' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[12.5px] leading-[1.4] truncate"
                      style={{ color: activeId === conv.id ? '#e5e7eb' : '#9ca3af' }}
                    >
                      {conv.title}
                    </p>
                    <p className="text-[10.5px] text-gray-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {relativeTime(conv.createdAt)}
                    </p>
                  </div>
                </div>
              </button>

              {/* Delete button */}
              <AnimatePresence>
                {hoveredId === conv.id && (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                    style={{ color: '#4b5563' }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ color: '#f87171' }}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Welcome screen ─────────────────────────────────────────────────────────
function WelcomeScreen({ onNew }) {
  const capabilities = [
    { icon: '🔍', title: 'Explain Code', desc: 'Understand any function, class, or algorithm' },
    { icon: '🐛', title: 'Debug Errors', desc: 'Diagnose bugs and stack traces instantly' },
    { icon: '✨', title: 'Generate Fixes', desc: 'Get production-ready code corrections' },
    { icon: '⚡', title: 'Code Review', desc: 'Spot issues and improve code quality' },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.18))',
            border: '1px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          }}
        >
          <Bot className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">AI Dev Assistant</h2>
        <p className="text-gray-500 text-[14px] max-w-sm mx-auto leading-relaxed">
          Your intelligent pair programmer. Ask anything about your code — explain, debug, fix, or improve.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-3 w-full max-w-md mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {capabilities.map(({ icon, title, desc }, i) => (
          <motion.div
            key={title}
            className="px-4 py-3.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05 }}
          >
            <div className="text-xl mb-1.5">{icon}</div>
            <div className="text-[13px] font-medium text-white mb-0.5">{title}</div>
            <div className="text-[11.5px] text-gray-500 leading-relaxed">{desc}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        onClick={onNew}
        className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-semibold text-white"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.03, boxShadow: '0 6px 32px rgba(124,58,237,0.55)' }}
        whileTap={{ scale: 0.97 }}
      >
        <Sparkles className="w-4 h-4" />
        Start a Conversation
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function DevAssistantPage({ onClose }) {
  const [conversations, setConversations] = useState(() => loadConversations());
  const [activeId, setActiveId]           = useState(null);

  const activeConv = conversations.find((c) => c.id === activeId) || null;

  // Persist whenever conversations change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // ── Create new conversation ────────────────────────────────
  const handleNew = useCallback(() => {
    const conv = newConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  // ── Select conversation ────────────────────────────────────
  const handleSelect = useCallback((id) => {
    setActiveId(id);
  }, []);

  // ── Delete conversation ────────────────────────────────────
  const handleDelete = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  // ── Update messages in active conversation ─────────────────
  const handleUpdateMessages = useCallback((id, messages, title) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages, title: title || c.title }
          : c
      )
    );
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(4,4,12,0.99)', backdropFilter: 'blur(30px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── TOP BAR ──────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.45)' }}
      >
        <motion.button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-sm transition-colors hover:bg-white/[0.05]"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <div className="w-px h-5 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">AI Dev Assistant</span>
          {activeConv?.title && activeConv.title !== 'New conversation' && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400 truncate max-w-[260px]">{activeConv.title}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Conversation count badge */}
        {conversations.length > 0 && (
          <div
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── BODY ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
        />

        {/* Main area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!activeId ? (
              <motion.div
                key="welcome"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WelcomeScreen onNew={handleNew} />
              </motion.div>
            ) : (
              <motion.div
                key={activeId}
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DevChatPanel
                  conversation={activeConv}
                  onUpdateMessages={(msgs, title) => handleUpdateMessages(activeId, msgs, title)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
