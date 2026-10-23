import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatService } from "./chatService";

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
