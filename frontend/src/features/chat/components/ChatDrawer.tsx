import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { useChatHistory } from '../hooks/useChatHistory';
import { useSendMessage } from '../hooks/useChat';
import type { ChatMessage } from '../types';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [suggestionText, setSuggestionText] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const { data: historyMessages } = useChatHistory(conversationId);
  const sendMutation = useSendMessage(conversationId);

  const messages = historyMessages ?? localMessages;
  const hasMessages = messages.length > 0;

  const handleSend = useCallback(
    (message: string) => {
      const now = new Date().toISOString();
      const tempUserMsg: ChatMessage = {
        id: Date.now(),
        conversation_id: conversationId ?? '',
        role: 'user',
        content: message,
        client_id: selectedClientId,
        created_at: now,
      };

      setLocalMessages((prev) => [...prev, tempUserMsg]);

      sendMutation.mutate(
        { message, conversation_id: conversationId, client_id: selectedClientId },
        {
          onSuccess: (data) => {
            if (!conversationId) {
              setConversationId(data.user_message.conversation_id);
            }
            setLocalMessages((prev) => {
              const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
              return [...withoutTemp, data.user_message, data.assistant_message];
            });
          },
        },
      );
    },
    [conversationId, sendMutation, selectedClientId],
  );

  const handleSuggestionClick = useCallback((text: string) => {
    setSuggestionText(text);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-[90vw] flex-col bg-white shadow-2xl"
          >
            <ChatHeader
              onClose={onClose}
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
            />

            {hasMessages ? (
              <ChatMessages messages={messages} isTyping={sendMutation.isPending} />
            ) : (
              <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
            )}

            <ChatInput
              onSend={handleSend}
              isSending={sendMutation.isPending}
              initialValue={suggestionText}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
