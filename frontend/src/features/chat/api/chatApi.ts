import { apiClient } from '@/lib/api/client';

import type { ChatMessage, ChatRequest, ChatResponse } from '../types';

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/chat/', request);
    return data;
  },

  getHistory: async (
    conversationId?: string,
    limit = 50,
  ): Promise<ChatMessage[]> => {
    const params: Record<string, string> = { limit: String(limit) };
    if (conversationId) {
      params.conversation_id = conversationId;
    }
    const { data } = await apiClient.get<ChatMessage[]>('/chat/history/', { params });
    return data;
  },
};
