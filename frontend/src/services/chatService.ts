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

/** Callbacks de la respuesta en vivo. */
export interface ChatStreamHandlers {
  onMeta?: (meta: Omit<ChatResponse, 'answer'>) => void;
  onDelta?: (text: string) => void;
}

type StreamEvent =
  | { type: 'meta'; requestId: string; status: ChatResponse['status']; garment: ChatResponse['garment']; sources: ChatResponse['sources']; meta: ChatResponse['meta'] }
  | { type: 'delta'; text: string }
  | { type: 'done'; status: ChatResponse['status']; answer: string; garment: ChatResponse['garment']; sources: ChatResponse['sources'] };

function parseEvents(buffer: string): { events: StreamEvent[]; rest: string } {
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events: StreamEvent[] = [];
  for (const block of blocks) {
    const line = block.split('\n').find((l) => l.startsWith('data: '));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as StreamEvent);
    } catch {
      /* fragmento inválido: se ignora */
    }
  }
  return { events, rest };
}

/**
 * Envía la pregunta a POST /v1/chat/stream y entrega el texto a medida que llega.
 * Resuelve con la respuesta final (la misma forma que el contrato JSON).
 */
export async function streamChatMessage(
  question: string,
  handlers: ChatStreamHandlers = {},
  sessionId?: string,
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Error al conectar con el servidor');
  }

  let meta: Extract<StreamEvent, { type: 'meta' }> | null = null;
  let text = '';
  let final: ChatResponse | null = null;

  const handle = (event: StreamEvent) => {
    if (event.type === 'meta') {
      meta = event;
      const { type: _type, ...rest } = event;
      handlers.onMeta?.(rest);
    } else if (event.type === 'delta') {
      text += event.text;
      handlers.onDelta?.(event.text);
    } else if (meta) {
      final = {
        requestId: meta.requestId,
        status: event.status,
        answer: event.answer,
        garment: event.garment,
        sources: event.sources,
        meta: meta.meta,
      };
    }
  };

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseEvents(buffer);
      buffer = parsed.rest;
      parsed.events.forEach(handle);
    }
  } else {
    parseEvents(`${await response.text()}\n\n`).events.forEach(handle);
  }

  if (final) return final;
  if (meta && text) {
    const m = meta as Extract<StreamEvent, { type: 'meta' }>;
    return { requestId: m.requestId, status: m.status, answer: text, garment: m.garment, sources: m.sources, meta: m.meta };
  }
  throw new Error('La respuesta del servidor se interrumpió. Intenta de nuevo.');
}

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