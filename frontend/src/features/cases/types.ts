export type CaseStatus = 'active' | 'closed' | 'archived';

export interface Case {
  id: string;
  client_id: string;
  title: string;
  case_number: string;
  description: string | null;
  status: CaseStatus;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaseDetail extends Case {
  client_name: string;
  documents: CaseDocument[];
}

export interface CaseDocument {
  id: string;
  name: string;
  file_type: 'image' | 'pdf';
  status: string;
  file_size_bytes: number;
  created_at: string;
}

export interface CaseCreateRequest {
  title: string;
  case_number: string;
  description?: string;
  status?: CaseStatus;
}

export interface CaseUpdateRequest extends Partial<CaseCreateRequest> {}
