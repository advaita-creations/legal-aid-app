import { djangoApi } from '@/lib/django-api';

export interface Advocate {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  documents_count: number;
  clients_count: number;
  last_login: string | null;
  date_joined: string;
}

export interface AdminStats {
  total_advocates: number;
  active_advocates: number;
  total_clients: number;
  total_cases: number;
  total_documents: number;
  documents_by_status: {
    uploaded: number;
    ready_to_process: number;
    in_progress: number;
    processed: number;
  };
}

export const adminApi = {
  getAdvocates: async (params?: { search?: string; is_active?: string }): Promise<{ count: number; results: Advocate[] }> => {
    const response = await djangoApi.get<{ count: number; results: Advocate[] }>('/admin/advocates/', { params });
    return response.data;
  },

  toggleAdvocate: async (id: number, is_active: boolean): Promise<void> => {
    await djangoApi.patch(`/admin/advocates/${id}/`, { is_active });
  },

  getStats: async (): Promise<AdminStats> => {
    const response = await djangoApi.get<AdminStats>('/admin/stats/');
    return response.data;
  },
};
