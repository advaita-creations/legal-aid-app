import { djangoApi } from '@/lib/django-api';
import type { Document, DocumentStatusUpdateRequest } from '../types';

export const documentsApi = {
  getAll: async (params?: Record<string, string>): Promise<Document[]> => {
    const response = await djangoApi.get<{ results: Document[] }>('/documents/', { params });
    return response.data.results;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await djangoApi.get<Document>(`/documents/${id}/`);
    return response.data;
  },

  upload: async (data: {
    file: File;
    case_id: string;
    name: string;
    notes?: string;
  }): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('case', data.case_id);
    formData.append('name', data.name);
    if (data.notes) formData.append('notes', data.notes);
    const response = await djangoApi.post<Document>('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
