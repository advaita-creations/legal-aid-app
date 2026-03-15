export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  conversation_id: string;
  role: ChatRole;
  content: string;
  client_id: number | null;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  client_id?: number | null;
  case_id?: number | null;
}

export interface ChatResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}
