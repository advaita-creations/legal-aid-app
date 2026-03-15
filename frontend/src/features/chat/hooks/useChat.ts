import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '../api/chatApi';
import type { ChatRequest } from '../types';

export function useSendMessage(conversationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChatRequest) => chatApi.sendMessage(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', conversationId] });
    },
  });
}
