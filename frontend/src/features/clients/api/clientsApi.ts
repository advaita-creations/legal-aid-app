import { djangoApi } from '@/lib/django-api';
import type { Client, ClientFormData } from '../types';

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await djangoApi.get<Client[]>('/clients/');
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await djangoApi.get<Client>(`/clients/${id}/`);
    return response.data;
  },

  create: async (data: ClientFormData): Promise<Client> => {
    const response = await djangoApi.post<Client>('/clients/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ClientFormData>): Promise<Client> => {
    const response = await djangoApi.patch<Client>(`/clients/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await djangoApi.delete(`/clients/${id}/`);
  },
};
