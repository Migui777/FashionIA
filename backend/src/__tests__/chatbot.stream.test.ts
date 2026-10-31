import express from "express";
import request from "supertest";
import { createChatV1Router } from "../routes/chatV1.routes";
import type { StreamEvent, StreamWriter } from "../chatbot/stream";

function appWith(streamWriter: StreamWriter | null) {
  const app = express();
  app.use("/api/v1/chat", createChatV1Router({ streamWriter, answerWriter: null, freeAnswerWriter: null, rateLimitPerMinute: 100 }));
  return app;
}

function events(text: string): StreamEvent[] {
  return text
    .split("\n\n")
    .filter((block) => block.startsWith("data: "))
    .map((block) => JSON.parse(block.slice(6)) as StreamEvent);
}

function writerOf(...chunks: string[]): StreamWriter {
  return async function* () {
    for (const chunk of chunks) yield chunk;
  };
}

const post = (app: express.Express, question: string) =>
  request(app).post("/api/v1/chat/stream").send({ question });

describe("POST /api/v1/chat/stream", () => {
  it("responde como SSE con meta, delta y done", async () => {
    const res = await post(appWith(writerOf("El Vestido Aurora de Jardín ", "es ideal para primavera.")), "¿Qué temporada es ideal para el Vestido Aurora de Jardín?");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");

    const list = events(res.text);
    expect(list[0]).toMatchObject({ type: "meta", status: "answered", garment: { name: "Vestido Aurora de Jardín" } });
    const deltas = list.filter((e) => e.type === "delta").map((e) => (e as { text: string }).text);
    expect(deltas.join("")).toBe("El Vestido Aurora de Jardín es ideal para primavera.");
    expect(list.at(-1)).toMatchObject({ type: "done", status: "answered", answer: "El Vestido Aurora de Jardín es ideal para primavera." });
  });

  it("sin IA entrega la respuesta determinista completa", async () => {
    const res = await post(appWith(null), "¿Qué colores tiene el Vestido Aurora de Jardín?");
    const done = events(res.text).at(-1) as Extract<StreamEvent, { type: "done" }>;
    expect(done.status).toBe("answered");
    expect(done.answer).toContain("rosa palo");
    expect(done.sources[0].fields).toEqual(["colors"]);
  });

  it("preguntas del catálogo sin prenda: la IA responde y las fuentes salen de las prendas nombradas", async () => {
    const res = await post(appWith(writerOf("Para verano te recomiendo el Vestido Marea Serena ", "y el Traje Horizonte Claro.")), "¿Qué me recomiendas para el verano?");
    const done = events(res.text).at(-1) as Extract<StreamEvent, { type: "done" }>;
    expect(done.status).toBe("answered");
    expect(done.garment).toBeNull();
    expect(done.sources.map((s) => s.recordId)).toEqual(["VST-003", "TRA-003"]);
  });

  it("si la IA declara SIN_EVIDENCIA usa la respuesta determinista", async () => {
    const res = await post(appWith(writerOf("SIN_", "EVIDENCIA")), "¿Qué colores de temporada hay en el catálogo?");
    const list = events(res.text);
    expect(list.filter((e) => e.type === "delta")).toHaveLength(1);
    expect(list.at(-1)).toMatchObject({ type: "done", status: "no_evidence" });
    expect(JSON.stringify(list)).not.toContain("SIN_EVIDENCIA");
  });

  it("si la IA falla antes de responder usa la respuesta determinista", async () => {
    // eslint-disable-next-line require-yield
    const failing: StreamWriter = async function* () {
      throw new Error("sin cuota");
    };
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await post(appWith(failing), "¿Qué colores tiene el Vestido Aurora de Jardín?");
    const done = events(res.text).at(-1) as Extract<StreamEvent, { type: "done" }>;
    expect(done.answer).toContain("rosa palo");
  });

  it("fuera de alcance no consulta a la IA", async () => {
    const writer = jest.fn(writerOf("no debería usarse"));
    const res = await post(appWith(writer), "¿Cómo está el clima en Bogotá?");
    expect(writer).not.toHaveBeenCalled();
    expect(events(res.text).at(-1)).toMatchObject({ type: "done", status: "out_of_scope" });
  });

  it("los errores de validación siguen siendo JSON", async () => {
    const res = await request(appWith(null)).post("/api/v1/chat/stream").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
