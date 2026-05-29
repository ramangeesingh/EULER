import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftOpen } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ChatWorkspace from './components/ChatWorkspace';
import VideoBackground from './components/VideoBackground';
import { streamChat } from './lib/api';
import RepoIntelligencePage from './components/repo/RepoIntelligencePage';
import ArchitectureEnginePage from './components/architecture/ArchitectureEnginePage';

const INITIAL_CHATS = [
  { id: 1, title: 'AI architecture design',   timestamp: '2m ago'    },
  { id: 2, title: 'Fix authentication bug',   timestamp: '1h ago'    },
  { id: 3, title: 'Next.js project structure', timestamp: '3h ago'   },
  { id: 4, title: 'Database schema review',   timestamp: 'Yesterday'  },
  { id: 5, title: 'Optimize code performance', timestamp: '2 days ago' },
];

function AppShell() {
  // ── Feature overlays ──────────────────────────────────────────────────────
  const [activeFeature, setActiveFeature] = useState(null); // null | 'repo' | 'architecture'

  // ── Chat state ────────────────────────────────────────────────────────────
  const [chats]       = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleNewChat = () => {
    abortRef.current?.();
    abortRef.current = null;
    setActiveChat(null);
    setMessages([]);
    setIsStreaming(false);
  };

  const handleSendMessage = useCallback((text) => {
    if (isStreaming) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      const assistantMsg = { role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };
      const withAssistant = [...updated, assistantMsg];

      setIsStreaming(true);

      const abort = streamChat(
        updated.map((m) => ({ role: m.role, content: m.content })),
        {
          onToken: (token) => {
            setMessages((curr) => {
              const copy = [...curr];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === 'assistant') {
                copy[lastIdx] = { ...copy[lastIdx], content: copy[lastIdx].content + token };
              }
              return copy;
            });
          },
          onComplete: () => {
            setMessages((curr) => {
              const copy = [...curr];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === 'assistant') {
                copy[lastIdx] = { ...copy[lastIdx], isStreaming: false };
              }
              return copy;
            });
            setIsStreaming(false);
            abortRef.current = null;
          },
          onError: (error) => {
            setMessages((curr) => {
              const copy = [...curr];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === 'assistant') {
                copy[lastIdx] = { ...copy[lastIdx], content: copy[lastIdx].content || `⚠️ Error: ${error}`, isStreaming: false, isError: true };
              }
              return copy;
            });
            setIsStreaming(false);
            abortRef.current = null;
          },
        }
      );

      abortRef.current = abort;
      return withAssistant;
    });
  }, [isStreaming]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <VideoBackground />

      {/* Top gradient overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), rgba(0,0,0,0))', zIndex: 5, pointerEvents: 'none' }} />

      <div className="relative z-10 h-full flex">
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          onSelectChat={setActiveChat}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          onOpenFeature={setActiveFeature}
        />

        <AnimatePresence>
          {!sidebarOpen && (
            <motion.button
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-50 p-2 rounded-xl group"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.94 }}
              title="Open sidebar"
            >
              <PanelLeftOpen className="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors" />
            </motion.button>
          )}
        </AnimatePresence>

        <ChatWorkspace
          messages={messages}
          onSendMessage={handleSendMessage}
          hasActiveChat={messages.length > 0}
          isStreaming={isStreaming}
        />
      </div>

      {/* ── Feature overlays ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeFeature === 'repo' && (
          <RepoIntelligencePage key="repo" onClose={() => setActiveFeature(null)} />
        )}
        {activeFeature === 'architecture' && (
          <ArchitectureEnginePage key="arch" onClose={() => setActiveFeature(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    </AuthProvider>
  );
}
