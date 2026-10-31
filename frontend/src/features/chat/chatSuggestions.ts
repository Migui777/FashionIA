import { DEMO_GARMENTS } from "../augmented-reality/demoGarments";
import type { ChatResponse } from "../../types/chat";

export type AskedField = "materials" | "colors" | "style" | "season" | "creator" | "inspiration";

export interface Suggestion {
  emoji: string;
  label: string;
  /** Pregunta que se envía al chatbot al tocar la sugerencia. */
  question: string;
}

const FIELD_SUGGESTION: Record<AskedField, (name: string) => Suggestion> = {
  materials: (name) => ({ emoji: "🧵", label: "¿De qué materiales está hecho?", question: `¿De qué materiales está hecho el ${name}?` }),
  colors: (name) => ({ emoji: "🌈", label: "¿Qué colores tiene?", question: `¿Qué colores tiene el ${name}?` }),
  style: (name) => ({ emoji: "👗", label: "¿De qué estilo es?", question: `¿Qué estilo tiene el ${name}?` }),
  season: (name) => ({ emoji: "🌤️", label: "¿Para qué temporada es?", question: `¿Para qué temporada es el ${name}?` }),
  creator: (name) => ({ emoji: "🧑‍🎨", label: "¿Quién lo creó?", question: `¿Quién creó el ${name}?` }),
  inspiration: (name) => ({ emoji: "💡", label: "¿En qué se inspiró?", question: `¿En qué se inspiró el ${name}?` }),
};

const FIELD_ORDER: AskedField[] = ["materials", "colors", "style", "season", "creator", "inspiration"];
const MAX_FIELD_SUGGESTIONS = 3;

const STATUS_EMOJI = { answered: "✨", no_evidence: "🔍", out_of_scope: "🙈" } as const;
const FIELD_EMOJI: Record<AskedField, string> = { materials: "🧵", colors: "🌈", style: "👗", season: "🌤️", creator: "🧑‍🎨", inspiration: "💡" };

export function askedFieldOf(response: ChatResponse): AskedField | null {
  const field = response.sources[0]?.fields[0];
  return field && field in FIELD_EMOJI ? (field as AskedField) : null;
}

/** Emoji decorativo para el inicio de la respuesta, según estado y campo consultado. */
export function emojiFor(response: ChatResponse): string {
  const field = askedFieldOf(response);
  return field ? FIELD_EMOJI[field] : STATUS_EMOJI[response.status];
}

function otherGarment(currentName: string | null): Suggestion {
  const next = DEMO_GARMENTS.find((g) => g.name !== currentName) ?? DEMO_GARMENTS[0];
  return { emoji: "👗", label: `Conocer el ${next.name}`, question: `Cuéntame sobre el ${next.name}` };
}

/** Sugerencias de arranque, con o sin prenda de contexto. */
export function initialSuggestions(garmentName: string | null): { lead: string; items: Suggestion[] } {
  if (garmentName) {
    return { lead: "Empieza por aquí", items: FIELD_ORDER.slice(0, 4).map((f) => FIELD_SUGGESTION[f](garmentName)) };
  }
  return {
    lead: "Descubre el catálogo",
    items: DEMO_GARMENTS.slice(0, 3).map((g) => ({ emoji: g.name.startsWith("Traje") ? "🧥" : "👗", label: g.name, question: `Cuéntame sobre el ${g.name}` })),
  };
}

/**
 * Qué explorar después de una respuesta: los campos de la prenda que todavía
 * no se han consultado y otra prenda del catálogo. Si no hubo evidencia o la
 * pregunta se salió del alcance, se vuelve a proponer lo que sí se sabe.
 */
export function followUpSuggestions(
  response: ChatResponse,
  askedByGarment: ReadonlyMap<string, ReadonlySet<AskedField>>,
): { lead: string; items: Suggestion[] } {
  const garment = response.garment;
  if (response.status === "out_of_scope" || !garment) {
    return { lead: "Mejor probemos con esto", items: initialSuggestions(null).items };
  }

  const asked = askedByGarment.get(garment.id) ?? new Set<AskedField>();
  const remaining = FIELD_ORDER.filter((f) => !asked.has(f))
    .slice(0, MAX_FIELD_SUGGESTIONS)
    .map((f) => FIELD_SUGGESTION[f](garment.name));
  const items = [...remaining, otherGarment(garment.name)];
  return { lead: remaining.length > 0 ? "Hay más por descubrir" : "¿Seguimos explorando?", items };
}
