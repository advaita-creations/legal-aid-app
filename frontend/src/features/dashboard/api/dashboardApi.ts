import { djangoApi } from '@/lib/django-api';

export interface DashboardStats {
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

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await djangoApi.get<DashboardStats>('/dashboard/stats/');
    return response.data;
  },
};
