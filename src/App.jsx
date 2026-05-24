import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWorkspace from './components/ChatWorkspace';
import FloatingOrb from './components/orbs/FloatingOrb';
import StarField from './components/StarField';

function App() {
  const [chats] = useState([
    { id: 1, title: 'AI architecture design', timestamp: '2m ago' },
    { id: 2, title: 'Fix authentication bug', timestamp: '1h ago' },
    { id: 3, title: 'Next.js project structure', timestamp: '3h ago' },
    { id: 4, title: 'Database schema review', timestamp: 'Yesterday' },
    { id: 5, title: 'Optimize code performance', timestamp: '2 days ago' },
  ]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([]);
  };

  const handleSendMessage = (message) => {
    const newMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages([...messages, newMessage]);
    
    setTimeout(() => {
      const aiResponse = { 
        role: 'assistant', 
        content: 'I can help you with that. Let me analyze your request...', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f] relative">
      {/* Background Effects */}
      <StarField />
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <FloatingOrb size={500} color="from-purple-500/30 to-pink-500/30" delay={0} duration={15} />
        <FloatingOrb size={350} color="from-blue-500/20 to-cyan-500/20" delay={5} duration={12} />
        <FloatingOrb size={280} color="from-violet-500/25 to-purple-500/25" delay={8} duration={18} />
      </div>

      {/* Main Layout */}
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

export default App;
