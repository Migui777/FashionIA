import express, { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { getCatalogLoader, sourceFromEnv } from "../chatbot/catalog";
import type { CatalogSource } from "../chatbot/catalog";
import { detectRequestedField, handleChat } from "../chatbot/handler";
import { createGeminiAnswerWriter, createGeminiFreeAnswerWriter, enhanceFreeResult, enhanceResult } from "../chatbot/aiAnswer";
import type { AnswerWriter, FreeAnswerWriter } from "../chatbot/aiAnswer";
import type { Catalog, ChatErrorBody, ChatErrorCode, ChatSuccessBody } from "../chatbot/contract";
import { NO_EVIDENCE_MARKER, createGeminiStreamWriter, firstChunk, resolveCatalogAnswer } from "../chatbot/stream";
import type { StreamEvent, StreamWriter } from "../chatbot/stream";

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
  /** Redactor en vivo (POST /stream). Por defecto: Gemini bajo la misma configuración; null = respuesta determinista. */
  streamWriter?: StreamWriter | null;
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
  streamWriter = createGeminiStreamWriter(),
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

  /**
   * POST /api/v1/chat/stream: misma solicitud, respuesta como eventos SSE
   * (`meta`, `delta`*, `done`). Los errores de validación siguen siendo JSON.
   */
  router.post("/stream", async (req: Request, res: Response) => {
    const requestId: string = res.locals.requestId;
    let catalog: Catalog;
    try {
      catalog = await loadCatalog();
    } catch (err) {
      console.error(err);
      return res
        .status(503)
        .json(errorBody("UPSTREAM_UNAVAILABLE", "No se pudo consultar la fuente de datos. Intenta de nuevo más tarde.", requestId));
    }

    const base = handleChat(req.body, { catalog, requestId });
    if (base.statusCode !== 200) return res.status(base.statusCode).json(base.body);
    const body = base.body as ChatSuccessBody;
    const question = String(req.body.question).trim();

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    let closed = false;
    res.on("close", () => {
      closed = true;
    });
    const send = (event: StreamEvent) => {
      if (!closed) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    const sendDeterministic = () => {
      send({ type: "delta", text: body.answer });
      send({ type: "done", status: body.status, answer: body.answer, garment: body.garment, sources: body.sources });
    };

    send({ type: "meta", requestId, status: body.status, garment: body.garment, sources: body.sources, meta: body.meta });

    // La IA responde si la prenda se identificó con evidencia o si la pregunta es sobre el catálogo en general.
    const useAI = streamWriter !== null && (body.status === "answered" || (body.status === "no_evidence" && body.garment === null));
    if (!useAI) {
      sendDeterministic();
      return res.end();
    }

    let answer = "";
    let flushed = false;
    try {
      const iterator = streamWriter({ question, catalog, garment: body.garment })[Symbol.asyncIterator]();
      let step = await firstChunk(iterator);
      while (!step.done && !closed) {
        answer += step.value;
        const head = answer.trimStart();
        const maybeMarker = head.length < NO_EVIDENCE_MARKER.length && NO_EVIDENCE_MARKER.startsWith(head);
        if (head.startsWith(NO_EVIDENCE_MARKER)) break;
        if (flushed) send({ type: "delta", text: step.value });
        else if (!maybeMarker) {
          flushed = true;
          send({ type: "delta", text: answer });
        }
        step = await iterator.next();
      }
      await iterator.return?.();
    } catch (err) {
      console.error("[AI] Falló la respuesta en vivo con Gemini:", err);
    }

    const text = answer.trim();
    if (!flushed && text && !text.startsWith(NO_EVIDENCE_MARKER)) {
      flushed = true;
      send({ type: "delta", text: answer });
    }
    if (!flushed || !text) {
      // Sin texto utilizable (IA apagada, falló antes de responder o declaró falta de evidencia).
      sendDeterministic();
    } else if (body.garment) {
      send({ type: "done", status: "answered", answer: text, garment: body.garment, sources: body.sources });
    } else {
      send({ type: "done", answer: text, ...resolveCatalogAnswer(text, catalog) });
    }
    res.end();
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
