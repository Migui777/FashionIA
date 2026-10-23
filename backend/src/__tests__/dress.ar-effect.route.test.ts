import request from "supertest";
import { createApp } from "../app";
import { dressRepository } from "../repositories/dress.repository";
import type { Dress } from "../types/dress";

jest.mock("../repositories/dress.repository");

const auroraDress: Dress = {
  id: "aurora-1",
  name: "Aurora",
  description: "Un vestido etéreo.",
  designer: "Valentina Ruiz",
  collection: "Amanecer Eterno",
  category: "Vestido de gala",
  color: "Rosa dorado",
  materials: "Tul de seda",
  imageUrl: "/dresses/aurora.svg",
  model3dUrl: null,
  arEffectType: "particles",
  arEffectAssetUrl: null,
  arEffectIntensity: 0.7,
  story: "Historia del vestido.",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const app = createApp();

describe("GET /api/dresses/:id/ar-effect", () => {
  afterEach(() => jest.resetAllMocks());

  it("entrega solo la configuración del efecto, no la ficha completa del vestido", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(auroraDress);

    const res = await request(app).get("/api/dresses/aurora-1/ar-effect");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      type: "particles",
      assetUrl: null,
      intensity: 0.7,
    });
    // El frontend recibe exactamente lo que AROverlay necesita para
    // decidir qué componente renderizar, nada del resto de la ficha.
    expect(res.body).not.toHaveProperty("name");
    expect(res.body).not.toHaveProperty("story");
  });

  it("devuelve 404 cuando el vestido no existe", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/api/dresses/no-existe/ar-effect");

    expect(res.status).toBe(404);
  });
});
