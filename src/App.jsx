import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ChatWorkspace from './components/ChatWorkspace';
import CosmicBackground from './components/CosmicBackground';
import { streamChat } from './lib/api';
import RepoIntelligencePage from './components/repo/RepoIntelligencePage';
import ArchitectureEnginePage from './components/architecture/ArchitectureEnginePage';
import BuildWebsitePage from './components/website/BuildWebsitePage';
import DevAssistantPage from './components/devassistant/DevAssistantPage';

function AppShell() {
  const { session } = useAuth();

  // ── Feature overlays ──────────────────────────────────────────────────────
  const [activeFeature, setActiveFeature] = useState(null); // null | 'repo' | 'architecture'
  
  // Log activeFeature changes
  useEffect(() => {
    console.log('🎬 [APP] activeFeature changed to:', activeFeature);
    console.log('🎬 [APP] Location:', window.location.href);
  }, [activeFeature]);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [chats, setChats]             = useState([]);
  const [activeChat, setActiveChat]   = useState(null);
  const [messages,   setMessages]     = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Load user's chat history on mount or when session changes
  const fetchChats = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }, [session]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Load chat messages when activeChat changes
  useEffect(() => {
    if (!session?.access_token) return;
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChat.id}/messages`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const normalized = (data.messages || []).map((m) => ({
            role: m.role.toLowerCase(),
            content: m.content,
            timestamp: m.createdAt,
          }));
          setMessages(normalized);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();
  }, [activeChat, session]);

  const handleNewChat = () => {
    abortRef.current?.();
    abortRef.current = null;
    setActiveChat(null);
    setMessages([]);
    setIsStreaming(false);
  };

  const handleRenameChat = useCallback(async (chatId, newTitle) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
        );
        if (activeChat?.id === chatId) {
          setActiveChat((prev) => prev ? { ...prev, title: newTitle } : null);
        }
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  }, [session, activeChat]);

  const handleDeleteChat = useCallback(async (chatId) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChat?.id === chatId) {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }, [session, activeChat]);

  const handleSendMessage = useCallback((text) => {
    console.log('💬 [APP] handleSendMessage called');
    if (isStreaming || !session?.access_token) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      const assistantMsg = { role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };
      const withAssistant = [...updated, assistantMsg];

      setIsStreaming(true);

      const abort = streamChat(
        updated.map((m) => ({ role: m.role, content: m.content })),
        {
          accessToken: session.access_token,
          chatId: activeChat?.id,
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
          onComplete: (fullText, metadata) => {
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

            if (metadata) {
              const { chatId, title } = metadata;
              setActiveChat({ id: chatId, title });
              fetchChats();
            } else {
              fetchChats();
            }
          },
          onError: (error) => {
            // Log raw error for debugging — never put it in the UI
            console.error('[App] Chat stream error:', error);
            setMessages((curr) => {
              const copy = [...curr];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === 'assistant') {
                copy[lastIdx] = {
                  ...copy[lastIdx],
                  content: copy[lastIdx].content || '',
                  isStreaming: false,
                  isError: true,
                };
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
  }, [isStreaming, session, activeChat, fetchChats]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <CosmicBackground />

      {/* Top gradient overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), rgba(0,0,0,0))', zIndex: 5, pointerEvents: 'none' }} />

      <div className="relative z-10 h-full flex">
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          onSelectChat={setActiveChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
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
          onAction={setActiveFeature}
        />
      </div>

      {/* ── Feature overlays ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeFeature === 'repo' && (
          <RepoIntelligencePage 
            key="repo" 
            onClose={() => {
              console.log('❌ [APP] onClose called for Repo Intelligence');
              console.log('❌ [APP] Location before setActiveFeature:', window.location.href);
              setActiveFeature(null);
              console.log('❌ [APP] Location after setActiveFeature:', window.location.href);
            }} 
          />
        )}
        {activeFeature === 'architecture' && (
          <ArchitectureEnginePage key="arch" onClose={() => setActiveFeature(null)} />
        )}
        {activeFeature === 'website' && (
          <BuildWebsitePage key="website" onClose={() => setActiveFeature(null)} />
        )}
        {activeFeature === 'devassistant' && (
          <DevAssistantPage key="devassistant" onClose={() => setActiveFeature(null)} />
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
