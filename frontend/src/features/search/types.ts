export type SearchResultType = 'client' | 'case' | 'document';

export interface ClientResult {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  type: 'client';
}

export interface CaseResult {
  id: number;
  title: string;
  case_number: string;
  status: string;
  type: 'case';
}

export interface DocumentResult {
  id: number;
  name: string;
  file_type: string;
  status: string;
  type: 'document';
}

export type SearchResult = ClientResult | CaseResult | DocumentResult;

export interface SearchResponse {
  clients: ClientResult[];
  cases: CaseResult[];
  documents: DocumentResult[];
}
