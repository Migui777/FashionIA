import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatService, streamChatMessage } from "./chatService";

describe("chatService", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ message: "Respuesta del vestido" }), { status: 200 })),
    );
  });

  it("sends the dress chat request to the legacy chat endpoint", async () => {
    await expect(chatService.ask("dress-1", "¿Quién diseñó este vestido?")).resolves.toBe("Respuesta del vestido");

    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ dressId: "dress-1", message: "¿Quién diseñó este vestido?" }),
      }),
    );
  });

  it("propagates API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Dress not found" }), { status: 404 })),
    );

    await expect(chatService.ask("missing", "¿Quién diseñó este vestido?")).rejects.toThrow("Dress not found");
  });
});

describe("streamChatMessage", () => {
  const sse = (...events: object[]) =>
    new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""), { status: 200 });
  const meta = { type: "meta", requestId: "req_0001", status: "answered", garment: null, sources: [], meta: { contractVersion: "0.1", mock: true } };

  it("delivers the text as it arrives and resolves with the final answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sse(meta, { type: "delta", text: "Hola " }, { type: "delta", text: "mundo" }, { type: "done", status: "answered", answer: "Hola mundo", garment: null, sources: [] }),
      ),
    );
    const chunks: string[] = [];

    const res = await streamChatMessage("hola", { onDelta: (t) => chunks.push(t) });

    expect(fetch).toHaveBeenCalledWith("/api/v1/chat/stream", expect.objectContaining({ method: "POST" }));
    expect(chunks).toEqual(["Hola ", "mundo"]);
    expect(res).toMatchObject({ status: "answered", answer: "Hola mundo", meta: { mock: true } });
  });

  it("uses the streamed text when the final event never arrives", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sse(meta, { type: "delta", text: "Texto parcial" })));
    await expect(streamChatMessage("hola")).resolves.toMatchObject({ answer: "Texto parcial" });
  });

  it("throws the contract error message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "Demasiadas solicitudes." } }), { status: 429 })));
    await expect(streamChatMessage("hola")).rejects.toThrow("Demasiadas solicitudes.");
  });
});
