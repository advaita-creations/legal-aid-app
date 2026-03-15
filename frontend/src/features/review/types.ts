export type MismatchStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

export interface DocumentVersion {
  id: number;
  document: number;
  version_number: number;
  html_path: string;
  json_path: string;
  created_by: string | null;
  created_by_name: string;
  notes: string;
  created_at: string;
}

export interface DocumentMismatch {
  id: number;
  document: number;
  version: number;
  mismatch_id: string;
  field_label: string;
  original_text: string;
  suggested_text: string;
  status: MismatchStatus;
  resolved_text: string;
  resolved_by: string | null;
  resolved_by_name: string;
  resolved_at: string | null;
  confidence_score: number | null;
}

export interface ReviewSummary {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  edited: number;
  is_complete: boolean;
  latest_version: number;
}

export type MismatchAction = 'accept' | 'reject' | 'edit';

export interface MismatchResolutionRequest {
  action: MismatchAction;
  resolved_text?: string;
}
