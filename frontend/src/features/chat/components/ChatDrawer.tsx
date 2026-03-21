import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);

  const location = useLocation();
  const rqClient = useQueryClient();

  // Pre-populate client/case from the currently viewed document
  useEffect(() => {
    if (contextLoaded) return;
    const docMatch = location.pathname.match(/^\/documents\/(\d+)/);
    if (!docMatch) return;
    const docId = docMatch[1];
    // Try to read from react-query cache first
    const cached = rqClient.getQueryData<{ client_id: string | number; case_id: string | number }>(['documents', docId]);
    if (cached?.client_id) {
      setSelectedClientId(Number(cached.client_id));
      if (cached.case_id) setSelectedCaseId(Number(cached.case_id));
      setContextLoaded(true);
    }
  }, [location.pathname, rqClient, contextLoaded]);

  // Reset context when drawer re-opens on a different page
  useEffect(() => {
    if (open) setContextLoaded(false);
  }, [open]);

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
        { message, conversation_id: conversationId, client_id: selectedClientId, case_id: selectedCaseId },
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
          onError: () => {
            // Remove the optimistic temp message and add an error message
            setLocalMessages((prev) => {
              const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
              const errorMsg: ChatMessage = {
                id: Date.now() + 1,
                conversation_id: conversationId ?? '',
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try sending your message again.',
                client_id: null,
                created_at: new Date().toISOString(),
              };
              return [...withoutTemp, tempUserMsg, errorMsg];
            });
          },
        },
      );
    },
    [conversationId, sendMutation, selectedClientId, selectedCaseId],
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
              selectedCaseId={selectedCaseId}
              onCaseChange={setSelectedCaseId}
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
