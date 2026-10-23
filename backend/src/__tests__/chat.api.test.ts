import request from "supertest";
import { createApp } from "../app";
import { dressRepository } from "../repositories/dress.repository";
import type { Dress } from "../types/dress";

jest.mock("../repositories/dress.repository");

const mockDress: Dress = {
  id: "1",
  name: "Aurora",
  description: "Un vestido etéreo.",
  designer: "Valentina Ruiz",
  collection: "Amanecer Eterno",
  category: "Vestido de gala",
  color: "Rosa dorado",
  materials: "Tul de seda",
  imageUrl: null,
  model3dUrl: null,
  arEffectType: "particles",
  arEffectAssetUrl: null,
  arEffectIntensity: 0.7,
  story: "Historia del vestido.",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const app = createApp();

describe("POST /api/chat", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns an answer using the dress context (mock provider)", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(mockDress);

    const res = await request(app)
      .post("/api/chat")
      .send({ dressId: "1", message: "¿De qué material está hecho?" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Tul de seda");
  });

  it("returns 400 when message is missing", async () => {
    const res = await request(app).post("/api/chat").send({ dressId: "1" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the dress does not exist", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).post("/api/chat").send({ dressId: "missing", message: "hola" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/dresses", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns the list of dresses", async () => {
    (dressRepository.findAll as jest.Mock).mockResolvedValue([mockDress]);
    const res = await request(app).get("/api/dresses");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Aurora");
  });
});
