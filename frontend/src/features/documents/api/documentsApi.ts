import { apiClient } from '@/lib/api/client';
import type { Document, DocumentStatusUpdateRequest, DocumentVersion, ProcessingLogsResponse } from '../types';

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

  saveVersion: async (id: string, data: { html_content: string; notes?: string }): Promise<DocumentVersion> => {
    const response = await apiClient.post<DocumentVersion>(`/v2/documents/${id}/versions/save/`, data);
    return response.data;
  },

  getVersions: async (id: string): Promise<DocumentVersion[]> => {
    const response = await apiClient.get<DocumentVersion[]>(`/v2/documents/${id}/versions/`);
    return response.data;
  },

  finalizeRag: async (id: string): Promise<{ ok: boolean; version: number; rag_response: string }> => {
    const response = await apiClient.post<{ ok: boolean; version: number; rag_response: string }>(
      `/v2/documents/${id}/finalize-rag/`,
    );
    return response.data;
  },

  generatePdf: async (id: string): Promise<{ ok: boolean; pdf_url: string; pdf_size: number; status: string }> => {
    const response = await apiClient.post<{ ok: boolean; pdf_url: string; pdf_size: number; status: string }>(
      `/v2/documents/${id}/generate-pdf/`,
    );
    return response.data;
  },

  revertVersion: async (id: string, versionId: number): Promise<{ ok: boolean; reverted_to: number }> => {
    const response = await apiClient.post<{ ok: boolean; reverted_to: number }>(
      `/v2/documents/${id}/versions/${versionId}/revert/`,
    );
    return response.data;
  },

  getProcessingLogs: async (id: string): Promise<ProcessingLogsResponse> => {
    const response = await apiClient.get<ProcessingLogsResponse>(`/v2/documents/${id}/logs/`);
    return response.data;
  },

  uploadV2Files: async (id: string, formData: FormData): Promise<{ ok: boolean }> => {
    const response = await apiClient.post<{ ok: boolean }>(
      `/v2/documents/${id}/upload-v2-files/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
