import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage } from '../types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.created_at}
          />
        ))}
      </AnimatePresence>
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
