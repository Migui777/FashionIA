import express, { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { getCatalogLoader, sourceFromEnv } from "../chatbot/catalog";
import type { CatalogSource } from "../chatbot/catalog";
import { detectRequestedField, handleChat } from "../chatbot/handler";
import { createGeminiAnswerWriter, createGeminiFreeAnswerWriter, enhanceFreeResult, enhanceResult } from "../chatbot/aiAnswer";
import type { AnswerWriter, FreeAnswerWriter } from "../chatbot/aiAnswer";
import type { Catalog, ChatErrorBody, ChatErrorCode } from "../chatbot/contract";

const MAX_BODY = "10kb";
const WINDOW_MS = 60_000;

export interface ChatV1Options {
  /** Fuente de datos: "mock" (fixtures, por defecto) o "db" (vestidos de PostgreSQL). Env: CHATBOT_SOURCE. */
  source?: CatalogSource;
  /** Reemplaza la fuente (útil en pruebas). */
  loadCatalog?: () => Promise<Catalog> | Catalog;
  rateLimitPerMinute?: number;
  /** Redactor de respuestas con IA. Por defecto: Gemini si AI_PROVIDER=gemini y hay GEMINI_API_KEY; null = solo reglas. */
  answerWriter?: AnswerWriter | null;
  /** Redactor de preguntas abiertas. Por defecto: Gemini bajo la misma configuración que answerWriter. */
  freeAnswerWriter?: FreeAnswerWriter | null;
}

/**
 * Contrato v0.1 del chatbot: POST /api/v1/chat.
 * Es autónomo (parser JSON, límite de solicitudes y errores propios) porque su formato
 * de error `{ error: { code, message, requestId } }` difiere del resto de la API.
 * Debe montarse ANTES de `express.json()` global.
 */
export function createChatV1Router({
  source = sourceFromEnv(),
  loadCatalog = getCatalogLoader(source),
  rateLimitPerMinute = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20),
  answerWriter = createGeminiAnswerWriter(),
  freeAnswerWriter = createGeminiFreeAnswerWriter(),
}: ChatV1Options = {}): Router {
  const router = Router();
  let counter = 0;
  const hits = new Map<string, number[]>();

  const nextRequestId = () => `req_${String(++counter).padStart(4, "0")}`;
  const errorBody = (code: ChatErrorCode, message: string, requestId: string): ChatErrorBody => ({
    error: { code, message, requestId },
  });

  // Límite en memoria por IP (suficiente para el MVP; no sirve con varias instancias).
  function checkRate(key: string, now: number) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= rateLimitPerMinute) {
      hits.set(key, recent);
      return { ok: false as const, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)) };
    }
    recent.push(now);
    hits.set(key, recent);
    return { ok: true as const };
  }

  router.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.requestId = nextRequestId();
    next();
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") return next();
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).json(errorBody("METHOD_NOT_ALLOWED", "Usa POST.", res.locals.requestId));
    }
    const rate = checkRate(req.ip ?? "unknown", Date.now());
    if (!rate.ok) {
      res.set("Retry-After", String(rate.retryAfter));
      return res
        .status(429)
        .json(errorBody("RATE_LIMITED", "Demasiadas solicitudes. Intenta de nuevo en un momento.", res.locals.requestId));
    }
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json(errorBody("UNSUPPORTED_MEDIA_TYPE", "El Content-Type debe ser application/json.", res.locals.requestId));
    }
    next();
  });

  router.use(express.json({ limit: MAX_BODY }));

  router.post("/", async (req: Request, res: Response) => {
    const requestId: string = res.locals.requestId;
    try {
      const catalog = await loadCatalog();
      const base = handleChat(req.body, { catalog, requestId });
      const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
      const fieldResult = await enhanceResult(base, question, catalog.mock, answerWriter);
      const result = detectRequestedField(question) === null
        ? await enhanceFreeResult(fieldResult, question, catalog.mock, freeAnswerWriter)
        : fieldResult;
      res.status(result.statusCode).json(result.body);
    } catch (err) {
      console.error(err);
      res
        .status(503)
        .json(errorBody("UPSTREAM_UNAVAILABLE", "No se pudo consultar la fuente de datos. Intenta de nuevo más tarde.", requestId));
    }
  });

  // Errores del parser (JSON inválido o cuerpo demasiado grande) con el formato del contrato.
  router.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const type = (err as { type?: string } | null)?.type;
    if (type === "entity.parse.failed") {
      return res.status(400).json(errorBody("VALIDATION_ERROR", "El cuerpo debe ser JSON válido.", res.locals.requestId));
    }
    if (type === "entity.too.large") {
      return res
        .status(400)
        .json(errorBody("VALIDATION_ERROR", "El cuerpo de la solicitud es demasiado grande.", res.locals.requestId));
    }
    next(err);
  });

  return router;
}
