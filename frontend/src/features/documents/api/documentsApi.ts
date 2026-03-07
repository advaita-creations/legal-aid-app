import { apiClient } from '@/lib/api/client';
import type { Document, DocumentStatusUpdateRequest } from '../types';

export const documentsApi = {
  getAll: async (params?: Record<string, string>): Promise<Document[]> => {
    const response = await apiClient.get<{ results: Document[] }>('/documents/', { params });
    return response.data.results;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await apiClient.get<Document>(`/documents/${id}/`);
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
    const response = await apiClient.post<Document>('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateStatus: async (id: string, data: DocumentStatusUpdateRequest): Promise<Document> => {
    const response = await apiClient.patch<Document>(`/documents/${id}/status/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}/`);
  },

  getDownloadUrl: async (id: string): Promise<{ url: string; name: string; mime_type: string }> => {
    const response = await apiClient.get<{ url: string; name: string; mime_type: string }>(
      `/documents/${id}/download/`,
    );
    return response.data;
  },
};
