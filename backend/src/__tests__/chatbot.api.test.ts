import express from "express";
import request from "supertest";
import { createApp } from "../app";
import { createChatV1Router } from "../routes/chatV1.routes";
import { dressRepository } from "../repositories/dress.repository";

const json = { "Content-Type": "application/json" };

describe("POST /api/v1/chat (app completa)", () => {
  const app = createApp();

  it("devuelve 200 con requestId y meta.mock", async () => {
    const res = await request(app).post("/api/v1/chat").send({ question: "¿Materiales del Vestido Aurora?" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("answered");
    expect(res.body.requestId).toMatch(/^req_\d{4}$/);
    expect(res.body.meta).toEqual({ contractVersion: "0.1", mock: true });
  });

  it("Content-Type incorrecto devuelve 415", async () => {
    const res = await request(app).post("/api/v1/chat").set("Content-Type", "text/plain").send("hola");
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("JSON inválido devuelve 400 con el formato del contrato", async () => {
    const res = await request(app).post("/api/v1/chat").set(json).send("{no es json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("cuerpo demasiado grande devuelve 400", async () => {
    const res = await request(app).post("/api/v1/chat").send({ question: "a".repeat(20_000) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("error simulado devuelve 503", async () => {
    const res = await request(app).post("/api/v1/chat").send({ question: "__simular_error__" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("UPSTREAM_UNAVAILABLE");
  });

  it("GET devuelve 405 con Allow: POST", async () => {
    const res = await request(app).get("/api/v1/chat");
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe("POST");
  });

  it("no rompe el endpoint existente /api/chat (400 sin dressId)", async () => {
    const res = await request(app).post("/api/chat").send({ message: "hola" });
    expect(res.status).toBe(400);
  });
});

describe("límite de solicitudes", () => {
  it("devuelve 429 con Retry-After al superar el límite", async () => {
    const app = express();
    app.use("/api/v1/chat", createChatV1Router({ rateLimitPerMinute: 2 }));
    await request(app).post("/api/v1/chat").send({ question: "hola" });
    await request(app).post("/api/v1/chat").send({ question: "hola" });
    const res = await request(app).post("/api/v1/chat").send({ question: "hola" });
    expect(res.status).toBe(429);
    expect(Number(res.headers["retry-after"])).toBeGreaterThanOrEqual(1);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});

describe("fuente db (vestidos de la base de datos)", () => {
  const dress = {
    id: "ck1",
    name: "Aurora",
    description: null,
    designer: "Valentina Ruiz",
    collection: null,
    category: "Vestido de gala",
    color: null,
    materials: "Tul de seda, hilo metálico, organza",
    imageUrl: null,
    model3dUrl: null,
    arEffectType: "glow",
    arEffectAssetUrl: null,
    arEffectIntensity: 0.6,
    story: "Aurora nace del cielo antes del amanecer.",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const build = () => {
    const app = express();
    app.use("/api/v1/chat", createChatV1Router({ source: "db" }));
    return app;
  };

  afterEach(() => jest.resetAllMocks());

  it("responde con los datos de la base de datos y meta.mock=false", async () => {
    jest.spyOn(dressRepository, "findAll").mockResolvedValue([dress] as never);
    const res = await request(build()).post("/api/v1/chat").send({ question: "¿De qué materiales es el Vestido Aurora?" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("answered");
    expect(res.body.answer).toBe("El Vestido Aurora está confeccionado en Tul de seda, hilo metálico y organza.");
    expect(res.body.garment.id).toBe("ck1");
    expect(res.body.sources[0]).toEqual({ recordId: "ck1", document: "dresses (base de datos)", fields: ["materials"] });
    expect(res.body.meta.mock).toBe(false);
  });

  it("campo ausente en la base de datos devuelve no_evidence", async () => {
    jest.spyOn(dressRepository, "findAll").mockResolvedValue([{ ...dress, designer: null }] as never);
    const res = await request(build()).post("/api/v1/chat").send({ question: "¿Quién diseñó el Vestido Aurora?" });
    expect(res.body.status).toBe("no_evidence");
  });

  it("si la base de datos falla devuelve 503 UPSTREAM_UNAVAILABLE", async () => {
    jest.spyOn(dressRepository, "findAll").mockRejectedValue(new Error("db caída"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await request(build()).post("/api/v1/chat").send({ question: "hola" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("UPSTREAM_UNAVAILABLE");
  });
});
