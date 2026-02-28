export type DocumentStatus = 'uploaded' | 'ready_to_process' | 'in_progress' | 'processed';
export type DocumentFileType = 'image' | 'pdf';

export interface Document {
  id: string;
  name: string;
  file_type: DocumentFileType;
  mime_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  case_id: string;
  case_title: string;
  client_id: string;
  client_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  status_history?: DocumentStatusEntry[];
}

export interface DocumentDetail extends Document {
  file_path: string;
  file_url: string;
  processed_output_path: string | null;
  processed_output_url: string | null;
  status_history: DocumentStatusEntry[];
}

export interface DocumentStatusEntry {
  id: number;
  from_status: DocumentStatus | null;
  to_status: DocumentStatus;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  notes: string | null;
}

export interface DocumentUploadRequest {
  file: File;
  name: string;
  case_id: string;
  notes?: string;
}

export interface DocumentStatusUpdateRequest {
  status: DocumentStatus;
  notes?: string;
}
