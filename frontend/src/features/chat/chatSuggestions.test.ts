import { describe, expect, it } from "vitest";
import type { ChatResponse } from "../../types/chat";
import { emojiFor, followUpSuggestions, initialSuggestions } from "./chatSuggestions";
import type { AskedField } from "./chatSuggestions";

const garment = { id: "VST-001", name: "Vestido Aurora de Jardín", type: "vestido", creator: "Elena", materials: ["algodón"], inspiration: null };

function response(overrides: Partial<ChatResponse> = {}): ChatResponse {
  return {
    requestId: "req_0001",
    status: "answered",
    answer: "ok",
    garment,
    sources: [{ recordId: "VST-001", document: "catalogo-mock.json", fields: ["materials"] }],
    meta: { contractVersion: "0.1", mock: true },
    ...overrides,
  };
}

describe("chatSuggestions", () => {
  it("offers the first four fields when a garment gives context", () => {
    const { items } = initialSuggestions("Vestido Aurora de Jardín");
    expect(items.map((i) => i.question)).toEqual([
      "¿De qué materiales está hecho el Vestido Aurora de Jardín?",
      "¿Qué colores tiene el Vestido Aurora de Jardín?",
      "¿Qué estilo tiene el Vestido Aurora de Jardín?",
      "¿Para qué temporada es el Vestido Aurora de Jardín?",
    ]);
  });

  it("offers catalog garments when there is no context", () => {
    const { items } = initialSuggestions(null);
    expect(items).toHaveLength(3);
    expect(items[0].question).toContain("Vestido Aurora de Jardín");
  });

  it("suggests only the fields not asked yet plus another garment", () => {
    const asked = new Map<string, Set<AskedField>>([["VST-001", new Set<AskedField>(["materials"])]]);
    const { items } = followUpSuggestions(response(), asked);
    expect(items.map((i) => i.label)).toEqual([
      "¿Qué colores tiene?",
      "¿De qué estilo es?",
      "¿Para qué temporada es?",
      expect.stringContaining("Conocer el"),
    ]);
    expect(items).toHaveLength(4);
    expect(items.at(-1)?.question).not.toContain("Aurora");
  });

  it("falls back to catalog suggestions when out of scope", () => {
    const { items } = followUpSuggestions(response({ status: "out_of_scope", garment: null, sources: [] }), new Map());
    expect(items).toHaveLength(3);
  });

  it("picks the emoji from the asked field or the status", () => {
    expect(emojiFor(response())).toBe("🧵");
    expect(emojiFor(response({ status: "no_evidence", sources: [] }))).toBe("🔍");
  });
});
