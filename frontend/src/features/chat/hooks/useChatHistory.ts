import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../api/chatApi';

export function useChatHistory(conversationId?: string) {
  return useQuery({
    queryKey: ['chat-history', conversationId],
    queryFn: () => chatApi.getHistory(conversationId),
    enabled: true,
  });
}
