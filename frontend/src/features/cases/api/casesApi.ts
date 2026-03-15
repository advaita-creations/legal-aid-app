import { apiClient } from '@/lib/api/client';
import type { Case, CaseCreateRequest, CaseEvent } from '../types';

export const casesApi = {
  getAll: async (): Promise<Case[]> => {
    const response = await apiClient.get<{ results: Case[] }>('/cases/');
    return response.data.results;
  },

  getById: async (id: string): Promise<Case> => {
    const response = await apiClient.get<Case>(`/cases/${id}/`);
    return response.data;
  },

  create: async (data: CaseCreateRequest & { client: string }): Promise<Case> => {
    const response = await apiClient.post<Case>('/cases/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CaseCreateRequest>): Promise<Case> => {
    const response = await apiClient.patch<Case>(`/cases/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cases/${id}/`);
  },

  getEvents: async (caseId: string): Promise<CaseEvent[]> => {
    const response = await apiClient.get<CaseEvent[]>(`/cases/${caseId}/events/`);
    return response.data;
  },

  addEvent: async (
    caseId: string,
    data: { event_type: string; title: string; description?: string },
  ): Promise<CaseEvent> => {
    const response = await apiClient.post<CaseEvent>(`/cases/${caseId}/events/`, data);
    return response.data;
  },
};
