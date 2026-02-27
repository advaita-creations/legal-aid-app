import { djangoApi } from '@/lib/django-api';
import type { Case, CaseCreateRequest } from '../types';

export const casesApi = {
  getAll: async (): Promise<Case[]> => {
    const response = await djangoApi.get<{ results: Case[] }>('/cases/');
    return response.data.results;
  },

  getById: async (id: string): Promise<Case> => {
    const response = await djangoApi.get<Case>(`/cases/${id}/`);
    return response.data;
  },

  create: async (data: CaseCreateRequest & { client: string }): Promise<Case> => {
    const response = await djangoApi.post<Case>('/cases/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CaseCreateRequest>): Promise<Case> => {
    const response = await djangoApi.patch<Case>(`/cases/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await djangoApi.delete(`/cases/${id}/`);
  },
};
