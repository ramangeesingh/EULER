import { useState, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWorkspace from './components/ChatWorkspace';
import VideoBackground from './components/VideoBackground';
import { streamChat } from './lib/api';

const INITIAL_CHATS = [
  { id: 1, title: 'AI architecture design',   timestamp: '2m ago'    },
  { id: 2, title: 'Fix authentication bug',   timestamp: '1h ago'    },
  { id: 3, title: 'Next.js project structure', timestamp: '3h ago'   },
  { id: 4, title: 'Database schema review',   timestamp: 'Yesterday'  },
  { id: 5, title: 'Optimize code performance', timestamp: '2 days ago' },
];

export default function App() {
  const [chats]       = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const handleNewChat = () => {
    // Abort any in-flight stream
    abortRef.current?.();
    abortRef.current = null;
    setActiveChat(null);
    setMessages([]);
    setIsStreaming(false);
  };

  const handleSendMessage = useCallback((text) => {
    if (isStreaming) return; // Don't allow sending while streaming

    const userMsg = { role: 'user', content: text, timestamp: new Date() };

    setMessages((prev) => {
      const updated = [...prev, userMsg];

      // Create the assistant placeholder
      const assistantMsg = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      const withAssistant = [...updated, assistantMsg];

      // Start streaming (using the messages WITHOUT the empty assistant msg)
      setIsStreaming(true);

      const abort = streamChat(
        updated.map((m) => ({ role: m.role, content: m.content })),
        {
          onToken: (token) => {
            setMessages((curr) => {
              const copy = [...curr];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === 'assistant') {
                copy[lastIdx] = {
                  ...copy[lastIdx],
                  content: copy[lastIdx].content + token,
                };
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
                copy[lastIdx] = {
                  ...copy[lastIdx],
                  content: copy[lastIdx].content || `⚠️ Error: ${error}`,
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
  }, [isStreaming]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* ONLY Video Background */}
      <VideoBackground />
      
      {/* Elegant top overlay to cover watermark */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), rgba(0,0,0,0))',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      {/* UI Layer */}
      <div className="relative z-10 h-full flex">
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          onSelectChat={setActiveChat}
        />
        <ChatWorkspace
          messages={messages}
          onSendMessage={handleSendMessage}
          hasActiveChat={messages.length > 0}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
