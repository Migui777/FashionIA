import { describe, expect, it, vi, beforeEach } from "vitest";
import { dressService } from "./dressService";

const mockDress = {
  id: "1",
  name: "Aurora",
  description: null,
  designer: "Valentina Ruiz",
  collection: null,
  category: null,
  color: null,
  materials: null,
  imageUrl: null,
  model3dUrl: null,
  arEffectType: "glow" as const,
  arEffectAssetUrl: null,
  arEffectIntensity: 0.5,
  story: null,
  createdAt: "",
  updatedAt: "",
};

describe("dressService", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/dresses")) {
          return new Response(JSON.stringify([mockDress]), { status: 200 });
        }
        if (url.endsWith("/dresses/1")) {
          return new Response(JSON.stringify(mockDress), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
      }),
    );
  });

  it("loads the list of dresses", async () => {
    const dresses = await dressService.getAll();
    expect(dresses).toHaveLength(1);
    expect(dresses[0].name).toBe("Aurora");
  });

  it("loads a single dress by id", async () => {
    const dress = await dressService.getById("1");
    expect(dress.name).toBe("Aurora");
  });

  it("throws when the dress does not exist", async () => {
    await expect(dressService.getById("missing")).rejects.toThrow();
  });
});
