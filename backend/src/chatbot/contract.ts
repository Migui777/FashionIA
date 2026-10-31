export const CONTRACT_VERSION = "0.1";
export const MAX_QUESTION_LENGTH = 500;
export const SIMULATED_ERROR_QUESTION = "__simular_error__";
export const OUT_OF_SCOPE_ANSWER =
  "Solo puedo responder preguntas sobre los vestidos y trajes del catálogo de Modas. " +
  "¿Quieres saber de materiales, creador o inspiración de alguna prenda?";

export type ChatStatus = "answered" | "no_evidence" | "out_of_scope";
export type GarmentField = "materials" | "creator" | "inspiration" | "colors" | "style" | "season";

export type ChatErrorCode =
  | "VALIDATION_ERROR"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "METHOD_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE";

/** Registro de la fuente (catálogo). Los campos opcionales pueden venir vacíos. */
export interface CatalogRecord {
  id: string;
  name: string;
  type: string;
  creator?: string | null;
  materials?: string[] | null;
  inspiration?: string | null;
  colors?: string[] | null;
  style?: string | null;
  season?: string | null;
}

export interface Catalog {
  document: string;
  records: CatalogRecord[];
  /** true cuando son datos ficticios: marca "(dato de prueba)" y meta.mock. */
  mock: boolean;
  /** true cuando `inspiration` es un texto largo (historia) y no una frase corta. */
  storyAsInspiration?: boolean;
}

export interface Garment {
  id: string;
  name: string;
  type: string;
  creator: string | null;
  materials: string[] | null;
  inspiration: string | null;
  colors: string[] | null;
  style: string | null;
  season: string | null;
}

export interface Source {
  recordId: string;
  document: string;
  fields: string[];
}

export interface ChatRequest {
  question: string;
  sessionId?: string;
}

export interface ChatSuccessBody {
  requestId: string;
  status: ChatStatus;
  answer: string;
  garment: Garment | null;
  sources: Source[];
  meta: { contractVersion: string; mock: boolean };
}

export interface ChatErrorBody {
  error: { code: ChatErrorCode; message: string; requestId: string };
}

export interface ChatResult {
  statusCode: number;
  body: ChatSuccessBody | ChatErrorBody;
}
