import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWorkspace from './components/ChatWorkspace';
import StarField from './components/StarField';
import CosmicBackground from './components/CosmicBackground';

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

  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([]);
  };

  const handleSendMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, timestamp: new Date() },
    ]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I can help you with that. Let me analyse your request and come up with the best solution.',
          timestamp: new Date(),
        },
      ]);
    }, 900);
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#0a0a12' }}
    >
      {/* ── Background layers ── */}
      <StarField />
      <CosmicBackground />

      {/* ── App shell ── */}
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
        />
      </div>
    </div>
  );
}
