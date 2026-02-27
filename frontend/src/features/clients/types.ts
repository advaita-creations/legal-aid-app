export interface Client {
  id: string;
  advocate: string;
  advocate_name: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface ClientDetail extends Client {
  cases: ClientCase[];
}

export interface ClientCase {
  id: string;
  title: string;
  case_number: string;
  status: 'active' | 'closed' | 'archived';
  documents_count: number;
  created_at: string;
}
