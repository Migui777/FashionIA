import express from "express";
import request from "supertest";
import { createChatV1Router } from "../routes/chatV1.routes";
import type { AnswerWriter } from "../chatbot/aiAnswer";

function appWith(answerWriter: AnswerWriter | null) {
  const app = express();
  app.use("/api/v1/chat", createChatV1Router({ answerWriter }));
  return app;
}

const ask = (app: express.Express, question: string) => request(app).post("/api/v1/chat").send({ question });

describe("POST /api/v1/chat con redactor de IA", () => {
  it("reemplaza answer pero conserva status, garment y sources", async () => {
    const writer = jest.fn<ReturnType<AnswerWriter>, Parameters<AnswerWriter>>().mockResolvedValue("Respuesta de IA");
    const res = await ask(appWith(writer), "¿De qué materiales está hecho el Vestido Aurora de Jardín?");

    expect(res.status).toBe(200);
    expect(res.body.answer).toBe("Respuesta de IA");
    expect(res.body.status).toBe("answered");
    expect(res.body.sources[0].fields).toEqual(["materials"]);
    expect(res.body.meta).toEqual({ contractVersion: "0.1", mock: true });
    expect(writer.mock.calls[0][0].field).toBe("materials");
    expect(writer.mock.calls[0][0].mock).toBe(true);
  });

  it("si la IA falla conserva la respuesta determinista", async () => {
    const writer: AnswerWriter = async () => {
      throw new Error("cuota agotada");
    };
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await ask(appWith(writer), "¿De qué materiales está hecho el Vestido Aurora de Jardín?");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("answered");
    expect(res.body.answer).toContain("confeccionado");
  });

  it("no llama a la IA en out_of_scope ni no_evidence", async () => {
    const writer = jest.fn<ReturnType<AnswerWriter>, Parameters<AnswerWriter>>().mockResolvedValue("x");
    const app = appWith(writer);

    expect((await ask(app, "¿Qué clima hace hoy?")).body.status).toBe("out_of_scope");
    expect((await ask(app, "¿De qué está hecho el Vestido Estrella?")).body.status).toBe("no_evidence");
    expect(writer).not.toHaveBeenCalled();
  });

  it("sin redactor (null) responde igual que antes", async () => {
    const res = await ask(appWith(null), "¿De qué materiales está hecho el Vestido Aurora de Jardín?");
    expect(res.body.answer).toContain("confeccionado");
  });
});
