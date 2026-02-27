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

export interface AdvocateSummary {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  documents_count: number;
  clients_count: number;
  last_login: string | null;
  created_at: string;
}
