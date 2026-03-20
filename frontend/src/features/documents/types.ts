export type DocumentStatus = 'uploaded' | 'ready_to_process' | 'in_progress' | 'processed' | 'finalized';
export type DocumentFileType = 'image' | 'pdf';

export interface Document {
  id: string;
  name: string;
  file_type: DocumentFileType;
  mime_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  case: string;
  case_id: string;
  case_title: string;
  client_id: string;
  client_name: string;
  notes: string | null;
  file_url: string | null;
  processed_html_url: string | null;
  processed_json_url: string | null;
  processed_report_url: string | null;
  extracted_pdf_url: string | null;
  created_at: string;
  updated_at: string;
  status_history?: DocumentStatusEntry[];
}

export interface ConsolidatedJson {
  document_metadata: {
    title: string;
    source: string;
    timestamp: string;
    mistral_sections_count: number;
    vector_sections_count: number;
  };
  document_title: string;
  sections: {
    section_heading: string;
    content: string;
    tables: string[];
  }[];
  tables: string[];
  total_sections: number;
}

export interface ValidationReport {
  raw: string;
  accuracy: string;
  discrepancies: number;
  humanReviewItems: number;
  illegibleItems: number;
  recommendations: string;
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

export interface DocumentVersion {
  id: number;
  document: number;
  version_number: number;
  html_path: string;
  json_path: string;
  created_by: string | null;
  notes: string;
  created_at: string;
}

export interface ProcessingLogEntry {
  timestamp: string;
  type: 'status' | 'version' | 'file';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail: string;
  actor: string;
}

export interface ProcessingLogsResponse {
  document_id: number;
  document_name: string;
  current_status: string;
  entries: ProcessingLogEntry[];
}
