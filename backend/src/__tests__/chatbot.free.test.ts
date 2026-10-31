import express from "express";
import request from "supertest";
import { createChatV1Router } from "../routes/chatV1.routes";
import type { AnswerWriter, FreeAnswerResult, FreeAnswerWriter } from "../chatbot/aiAnswer";

function appWith(freeAnswerWriter: FreeAnswerWriter | null, answerWriter: AnswerWriter | null = null) {
  const app = express();
  app.use("/api/v1/chat", createChatV1Router({ answerWriter, freeAnswerWriter }));
  return app;
}

const ask = (app: express.Express, question: string) => request(app).post("/api/v1/chat").send({ question });

const freeWriter = (result: FreeAnswerResult) =>
  jest.fn<ReturnType<FreeAnswerWriter>, Parameters<FreeAnswerWriter>>().mockResolvedValue(result);

const FREE_QUESTION = "Háblame del Vestido Aurora de Jardín";

describe("POST /api/v1/chat con respuesta libre de IA", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  describe("respuesta y fuentes", () => {
    it("acepta la respuesta y usa los campos declarados (validados) en sources", async () => {
      const writer = freeWriter({
        answerable: true,
        answer: "Resumen de IA",
        fieldsUsed: ["name", "creator", "materials"],
      });
      const res = await ask(appWith(writer), FREE_QUESTION);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("answered");
      expect(res.body.answer).toBe("Resumen de IA");
      expect(res.body.garment.id).toBe("VST-001");
      expect(res.body.sources).toEqual([
        { recordId: "VST-001", document: "catalogo-mock.json", fields: ["name", "creator", "materials"] },
      ]);
      expect(res.body.meta).toEqual({ contractVersion: "0.1", mock: true });
      expect(writer.mock.calls[0][0].mock).toBe(true);
    });

    it("descarta campos inventados y repetidos, conservando el orden", async () => {
      const writer = freeWriter({
        answerable: true,
        answer: "Texto",
        fieldsUsed: ["materials", "precio", "creator", "materials"],
      });
      const res = await ask(appWith(writer), FREE_QUESTION);
      expect(res.body.sources[0].fields).toEqual(["materials", "creator"]);
    });

    it("si ningún campo declarado es válido conserva el resumen fijo", async () => {
      const res = await ask(
        appWith(freeWriter({ answerable: true, answer: "Texto", fieldsUsed: ["precio", "talla"] })),
        FREE_QUESTION,
      );
      expect(res.body.status).toBe("answered");
      expect(res.body.answer).toContain("Puedo contarte sus materiales");
      expect(res.body.sources[0].fields).toEqual(["name", "type"]);
    });

    it("no acepta como usado un campo que la prenda no tiene (Marea Serena sin inspiración)", async () => {
      const res = await ask(
        appWith(freeWriter({ answerable: true, answer: "Texto", fieldsUsed: ["inspiration"] })),
        "Háblame del Vestido Marea Serena",
      );
      expect(res.body.answer).toContain("Puedo contarte sus materiales");
      expect(res.body.sources[0].fields).toEqual(["name", "type"]);
    });
  });

  describe("respuestas sin evidencia o con fallos", () => {
    it("answerable=false responde no_evidence con la prenda y sin campos", async () => {
      const res = await ask(
        appWith(freeWriter({ answerable: false, answer: "inventado", fieldsUsed: ["name"] })),
        "¿Es cómodo el Vestido Aurora de Jardín?",
      );
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("no_evidence");
      expect(res.body.garment.id).toBe("VST-001");
      expect(res.body.sources).toEqual([{ recordId: "VST-001", document: "catalogo-mock.json", fields: [] }]);
      expect(res.body.answer).toContain("no puedo responder eso");
      expect(res.body.answer).not.toContain("inventado");
    });

    it("si la IA falla conserva el resumen fijo", async () => {
      const writer: FreeAnswerWriter = async () => {
        throw new Error("cuota agotada");
      };
      const res = await ask(appWith(writer), FREE_QUESTION);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("answered");
      expect(res.body.answer).toContain("Puedo contarte sus materiales");
    });

    it("una respuesta vacía de la IA conserva el resumen fijo", async () => {
      const res = await ask(
        appWith(freeWriter({ answerable: true, answer: "   ", fieldsUsed: ["name"] })),
        FREE_QUESTION,
      );
      expect(res.body.answer).toContain("Puedo contarte sus materiales");
    });

    it("sin redactor libre (null) responde el resumen fijo de siempre", async () => {
      const res = await ask(appWith(null), FREE_QUESTION);
      expect(res.body.answer).toContain("Puedo contarte sus materiales");
      expect(res.body.sources[0].fields).toEqual(["name", "type"]);
    });
  });

  describe("selección del flujo", () => {
    it("una pregunta de campo concreto no usa el redactor libre", async () => {
      const free = freeWriter({ answerable: true, answer: "x", fieldsUsed: ["name"] });
      const res = await ask(appWith(free), "¿De qué materiales está hecho el Vestido Aurora de Jardín?");
      expect(res.body.answer).toContain("confeccionado");
      expect(free).not.toHaveBeenCalled();
    });

    it("no llama a la IA en out_of_scope ni en prenda inexistente", async () => {
      const free = freeWriter({ answerable: true, answer: "x", fieldsUsed: ["name"] });
      const app = appWith(free);
      expect((await ask(app, "¿Qué clima hace hoy?")).body.status).toBe("out_of_scope");
      expect((await ask(app, "¿De qué está hecho el Vestido Estrella?")).body.status).toBe("no_evidence");
      expect(free).not.toHaveBeenCalled();
    });
  });
});