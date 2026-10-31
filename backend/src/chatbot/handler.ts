import {
  CONTRACT_VERSION,
  MAX_QUESTION_LENGTH,
  OUT_OF_SCOPE_ANSWER,
  SIMULATED_ERROR_QUESTION,
} from "./contract";
import type {
  Catalog,
  CatalogRecord,
  ChatErrorCode,
  ChatResult,
  ChatStatus,
  Garment,
  GarmentField,
  Source,
} from "./contract";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Términos (sin acentos, en minúscula) que indican que la pregunta trata del catálogo.
const CATALOG_TERMS =
  /vestido|traje|prenda|catalogo|coleccion|material|tela|creador|disenad|inspir|autor|color|tono|estilo|temporada|estacion|verano|invierno|otono|primavera|look|tendencia/;

// Campo consultable: patrón sobre el texto normalizado y cómo se nombra si falta el dato.
const FIELDS: Record<GarmentField, { pattern: RegExp; missing: string }> = {
  materials: { pattern: /material|tela|hech[oa]|confeccion|fabric/, missing: "sus materiales" },
  creator: { pattern: /creador|creado|creo\b|disenad|autor|quien/, missing: "su creador" },
  inspiration: { pattern: /inspir/, missing: "su inspiración" },
  colors: { pattern: /colou?r|tono|paleta|cromatic/, missing: "sus colores" },
  style: { pattern: /estilo|tendencia|silueta|corte|look|ocasion/, missing: "su estilo" },
  season: { pattern: /temporada|estacion|epoca|verano|invierno|otono|primavera|clima/, missing: "su temporada" },
};

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMissing(value: unknown): boolean {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function toGarment(record: CatalogRecord): Garment {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    creator: isMissing(record.creator) ? null : (record.creator as string),
    materials: isMissing(record.materials) ? null : [...(record.materials as string[])],
    inspiration: isMissing(record.inspiration) ? null : (record.inspiration as string),
    colors: isMissing(record.colors) ? null : [...(record.colors as string[])],
    style: isMissing(record.style) ? null : (record.style as string),
    season: isMissing(record.season) ? null : (record.season as string),
  };
}

// Formas en que se puede nombrar una prenda, de la más a la menos específica:
// nombre completo, nombre sin el tipo ("aurora de jardin") y la palabra clave
// ("aurora"), esta última solo si no la comparte otra prenda.
function aliasesFor(record: CatalogRecord, records: CatalogRecord[]): string[] {
  const full = normalize(record.name);
  const withoutType = full.split(" ").slice(1).join(" ");
  const keyword = withoutType.split(" ")[0];
  const aliases = [full];
  if (withoutType) aliases.push(withoutType);
  const shared = records.some((other) => other !== record && normalize(other.name).split(" ").slice(1).includes(keyword));
  if (keyword && !shared) aliases.push(keyword);
  return aliases;
}

// Si la pregunta menciona varias prendas, se usa la que aparece primero.
function findGarment(records: CatalogRecord[], normalizedQuestion: string): CatalogRecord | null {
  let best: { record: CatalogRecord; index: number } | null = null;
  for (const record of records) {
    for (const alias of aliasesFor(record, records)) {
      const match = new RegExp(`\\b${escapeRegExp(alias)}\\b`).exec(normalizedQuestion);
      if (match && (best === null || match.index < best.index)) best = { record, index: match.index };
    }
  }
  return best ? best.record : null;
}

function detectField(normalizedQuestion: string): GarmentField | null {
  let best: { field: GarmentField; index: number } | null = null;
  for (const [field, { pattern }] of Object.entries(FIELDS) as [GarmentField, { pattern: RegExp }][]) {
    const match = pattern.exec(normalizedQuestion);
    if (match && (best === null || match.index < best.index)) best = { field, index: match.index };
  }
  return best ? best.field : null;
}

export function detectRequestedField(question: string): GarmentField | null {
  return detectField(normalize(question));
}

function answerFor(field: GarmentField, record: CatalogRecord, catalog: Catalog): string {
  const subject = `El ${record.name}${catalog.mock ? " (dato de prueba)" : ""}`;
  if (field === "materials") return `${subject} está confeccionado en ${joinList(record.materials as string[])}.`;
  if (field === "creator") return `${subject} es una creación de ${record.creator}.`;
  if (field === "colors") return `${subject} se presenta en ${joinList(record.colors as string[])}.`;
  if (field === "style") return `${subject} es de estilo ${lowerFirst(record.style as string)}.`;
  if (field === "season") return `${subject} está pensado para ${lowerFirst(record.season as string)}.`;
  if (catalog.storyAsInspiration) return `Sobre la inspiración del ${record.name}: ${record.inspiration}`;
  return `${subject} se inspira en ${lowerFirst(record.inspiration as string)}.`;
}

/**
 * Procesa una solicitud del contrato v0.1. Función pura: no depende de Express,
 * así el servicio real puede reutilizarla o reemplazarla manteniendo el contrato.
 */
export function handleChat(
  input: unknown,
  { catalog, requestId }: { catalog: Catalog; requestId: string },
): ChatResult {
  const error = (statusCode: number, code: ChatErrorCode, message: string): ChatResult => ({
    statusCode,
    body: { error: { code, message, requestId } },
  });
  const reply = (
    status: ChatStatus,
    answer: string,
    garment: Garment | null,
    sources: Source[],
  ): ChatResult => ({
    statusCode: 200,
    body: {
      requestId,
      status,
      answer,
      garment,
      sources,
      meta: { contractVersion: CONTRACT_VERSION, mock: catalog.mock },
    },
  });

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return error(400, "VALIDATION_ERROR", "El cuerpo debe ser un objeto JSON.");
  }
  const { question, sessionId } = input as { question?: unknown; sessionId?: unknown };
  const trimmed = typeof question === "string" ? question.trim() : "";
  if (trimmed.length < 1 || trimmed.length > MAX_QUESTION_LENGTH) {
    return error(
      400,
      "VALIDATION_ERROR",
      `El campo question es obligatorio y debe tener entre 1 y ${MAX_QUESTION_LENGTH} caracteres.`,
    );
  }
  if (sessionId !== undefined && (typeof sessionId !== "string" || !UUID_RE.test(sessionId))) {
    return error(400, "VALIDATION_ERROR", "El campo sessionId, si se envía, debe ser un UUID válido.");
  }

  if (trimmed === SIMULATED_ERROR_QUESTION) {
    return error(
      503,
      "UPSTREAM_UNAVAILABLE",
      "El servicio de IA no está disponible en este momento. Intenta de nuevo más tarde.",
    );
  }

  const normalizedQuestion = normalize(trimmed);
  const record = findGarment(catalog.records, normalizedQuestion);

  if (!record) {
    if (CATALOG_TERMS.test(normalizedQuestion)) {
      return reply(
        "no_evidence",
        "No encontré en la fuente una prenda que coincida con tu pregunta. " +
          "Prueba con el nombre de un vestido o un traje del catálogo.",
        null,
        [],
      );
    }
    return reply("out_of_scope", OUT_OF_SCOPE_ANSWER, null, []);
  }

  const garment = toGarment(record);
  const field = detectField(normalizedQuestion);

  if (!field) {
    return reply(
      "answered",
      `El ${record.name}${catalog.mock ? " (dato de prueba)" : ""} es un ${record.type}. ` +
        "Puedo contarte sus materiales, colores, estilo, temporada, creador o inspiración.",
      garment,
      [{ recordId: record.id, document: catalog.document, fields: ["name", "type"] }],
    );
  }

  if (isMissing(record[field])) {
    return reply(
      "no_evidence",
      `Tengo registrado el ${record.name}, pero la fuente no indica ${FIELDS[field].missing}, ` +
        "así que no puedo responder eso.",
      garment,
      [{ recordId: record.id, document: catalog.document, fields: [] }],
    );
  }

  return reply("answered", answerFor(field, record, catalog), garment, [
    { recordId: record.id, document: catalog.document, fields: [field] },
  ]);
}
