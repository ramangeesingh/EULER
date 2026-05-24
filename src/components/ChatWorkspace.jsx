import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatWorkspace({ messages, onSendMessage, hasActiveChat }) {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Scrollable message / welcome area */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <AnimatePresence mode="wait">
          {!hasActiveChat ? (
            <WelcomeScreen key="welcome" />
          ) : (
            <MessageList key="messages" messages={messages} />
          )}
        </AnimatePresence>
      </div>

      {/* Input bar — always at bottom */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
