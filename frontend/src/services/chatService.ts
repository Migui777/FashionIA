import type { ChatResponse } from '../types/chat';
import { api } from './api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface DressChatResponse {
  message: string;
}

export const chatService = {
  async ask(dressId: string, message: string): Promise<string> {
    const response = await api.post<DressChatResponse>('/chat', { dressId, message });
    return response.message;
  },
};

export async function sendChatMessage(question: string, sessionId?: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Error al conectar con el servidor');
  }

  return response.json();
}