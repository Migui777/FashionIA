export type ChatStatus = 'answered' | 'no_evidence' | 'out_of_scope';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface Garment {
  id: string;
  name: string;
  type: string;
  creator: string | null;
  materials: string[] | null;
  inspiration: string | null;
  colors?: string[] | null;
  style?: string | null;
  season?: string | null;
}

export interface ChatSource {
  recordId: string;
  document: string;
  fields: string[];
}

export interface ChatResponse {
  requestId: string;
  status: ChatStatus;
  answer: string;
  garment: Garment | null;
  sources: ChatSource[];
  meta: {
    contractVersion: string;
    mock: boolean;
  };
}