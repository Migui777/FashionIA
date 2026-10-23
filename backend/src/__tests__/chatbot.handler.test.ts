import { loadCatalog } from "../chatbot/catalog";
import { handleChat } from "../chatbot/handler";
import { OUT_OF_SCOPE_ANSWER, SIMULATED_ERROR_QUESTION } from "../chatbot/contract";
import type { ChatErrorBody, ChatSuccessBody } from "../chatbot/contract";

const catalog = loadCatalog();
const ask = (question: unknown, extra: object = {}) =>
  handleChat({ question, ...extra }, { catalog, requestId: "req_test" });
const ok = (question: string) => ask(question).body as ChatSuccessBody;

describe("handleChat (contrato v0.1)", () => {
  it("respuesta encontrada: materiales", () => {
    const { statusCode, body } = ask("¿De qué materiales está hecho el Vestido Aurora de Jardín?");
    const b = body as ChatSuccessBody;
    expect(statusCode).toBe(200);
    expect(b.status).toBe("answered");
    expect(b.answer).toBe("El Vestido Aurora de Jardín (dato de prueba) está confeccionado en algodón orgánico, tul de poliéster reciclado y bordado de hilo de seda.");
    expect(b.garment?.id).toBe("VST-001");
    expect(b.sources).toEqual([{ recordId: "VST-001", document: "catalogo-mock.json", fields: ["materials"] }]);
    expect(b.meta).toEqual({ contractVersion: "0.1", mock: true });
  });

  it("respuesta encontrada: creador e inspiración", () => {
    const creator = ok("¿Quién creó el Traje Bruma Andina?");
    expect(creator.status).toBe("answered");
    expect(creator.answer).toMatch(/Casa Ladera/);
    expect(creator.sources[0].fields).toEqual(["creator"]);

    const inspiration = ok("¿En qué se inspira el Traje Horizonte Claro?");
    expect(inspiration.status).toBe("answered");
    expect(inspiration.answer).toMatch(/se inspira en la arquitectura costera/);
  });

  it("ignora mayúsculas y acentos y acepta el nombre sin el tipo de prenda", () => {
    const b = ok("DE QUE MATERIALES ESTA HECHO EL bruma andina");
    expect(b.status).toBe("answered");
    expect(b.garment?.id).toBe("TRA-001");
  });

  it("campo no disponible: no inventa y devuelve la prenda", () => {
    const { statusCode, body } = ask("¿En qué se inspira el Vestido Marea Serena?");
    const b = body as ChatSuccessBody;
    expect(statusCode).toBe(200);
    expect(b.status).toBe("no_evidence");
    expect(b.answer).toBe(
      "Tengo registrado el Vestido Marea Serena, pero la fuente no indica su inspiración, así que no puedo responder eso.",
    );
    expect(b.garment?.inspiration).toBeNull();
    expect(b.sources).toEqual([{ recordId: "VST-003", document: "catalogo-mock.json", fields: [] }]);
  });

  it("prenda inexistente: no_evidence sin garment ni sources", () => {
    const b = ok("¿De qué está hecho el Vestido Estrella?");
    expect(b.status).toBe("no_evidence");
    expect(b.garment).toBeNull();
    expect(b.sources).toEqual([]);
  });

  it("fuera de alcance: respuesta fija", () => {
    const { statusCode, body } = ask("¿Qué celulares recomienda el chatbot?");
    const b = body as ChatSuccessBody;
    expect(statusCode).toBe(200);
    expect(b.status).toBe("out_of_scope");
    expect(b.answer).toBe(OUT_OF_SCOPE_ANSWER);
    expect(b.garment).toBeNull();
    expect(b.sources).toEqual([]);
  });

  it("si nombra una prenda sin pedir un campo, responde con un resumen", () => {
    const b = ok("Háblame del Traje Bruma Andina");
    expect(b.status).toBe("answered");
    expect(b.answer).toMatch(/es un traje/);
  });

  it("si menciona dos prendas usa la primera", () => {
    expect(ok("¿Materiales del Vestido Marea Serena o del Vestido Aurora?").garment?.id).toBe("VST-003");
  });

  it("un nombre compartido por dos prendas (\"jardín\") no elige una al azar", () => {
    expect(ok("¿Materiales del jardín?").garment).toBeNull();
    expect(ok("¿Qué materiales tiene el Traje Jardín Nocturno?").garment?.id).toBe("TRA-002");
  });

  it("una palabra común como \"claro\" no activa una prenda", () => {
    expect(ok("¿Es claro el material del traje?").garment).toBeNull();
  });

  it("error simulado", () => {
    const { statusCode, body } = ask(SIMULATED_ERROR_QUESTION);
    const e = (body as ChatErrorBody).error;
    expect(statusCode).toBe(503);
    expect(e.code).toBe("UPSTREAM_UNAVAILABLE");
    expect(e.requestId).toBe("req_test");
  });

  it("validación de question", () => {
    const cases = [{}, { question: "" }, { question: "   " }, { question: 42 }, { question: "a".repeat(501) }];
    for (const input of cases) {
      const { statusCode, body } = handleChat(input, { catalog, requestId: "req_test" });
      expect(statusCode).toBe(400);
      expect((body as ChatErrorBody).error.code).toBe("VALIDATION_ERROR");
    }
    expect(ask("a".repeat(500)).statusCode).toBe(200);
  });

  it("validación de sessionId y del cuerpo", () => {
    expect(ask("hola", { sessionId: "no-es-uuid" }).statusCode).toBe(400);
    expect(ask("hola", { sessionId: 123 }).statusCode).toBe(400);
    expect(ask("hola", { sessionId: "3f1c2b7e-9a41-4c1e-8d52-6a0b1f7e2c10" }).statusCode).toBe(200);
    for (const input of [null, "texto", [1, 2]]) {
      expect(handleChat(input, { catalog, requestId: "r" }).statusCode).toBe(400);
    }
  });
});
