import { apiClient } from '@/lib/api/client';

import type { SearchResponse } from '../types';

export const searchApi = {
  search: async (query: string): Promise<SearchResponse> => {
    const { data } = await apiClient.get<SearchResponse>('/search/', {
      params: { q: query },
    });
    return data;
  },
};
