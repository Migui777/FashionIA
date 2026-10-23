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
  creator: string;
  materials: string[];
  inspiration: string;
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