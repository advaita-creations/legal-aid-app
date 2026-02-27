import { djangoApi } from '@/lib/django-api';
import type { Document, DocumentStatusUpdateRequest } from '../types';

export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    const response = await djangoApi.get<{ results: Document[] }>('/documents/');
    return response.data.results;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await djangoApi.get<Document>(`/documents/${id}/`);
    return response.data;
  },

  create: async (data: {
    case: string;
    name: string;
    file_path: string;
    file_type: string;
    file_size_bytes: number;
    mime_type: string;
    notes?: string;
  }): Promise<Document> => {
    const response = await djangoApi.post<Document>('/documents/', data);
    return response.data;
  },

  updateStatus: async (id: string, data: DocumentStatusUpdateRequest): Promise<Document> => {
    const response = await djangoApi.patch<Document>(`/documents/${id}/status/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await djangoApi.delete(`/documents/${id}/`);
  },
};
