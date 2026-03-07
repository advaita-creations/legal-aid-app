import { apiClient } from '@/lib/api/client';
import type { Client, ClientFormData } from '../types';

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await apiClient.get<{ results: Client[] }>('/clients/');
    return response.data.results;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get<Client>(`/clients/${id}/`);
    return response.data;
  },

  create: async (data: ClientFormData): Promise<Client> => {
    const response = await apiClient.post<Client>('/clients/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ClientFormData>): Promise<Client> => {
    const response = await apiClient.patch<Client>(`/clients/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}/`);
  },
};
