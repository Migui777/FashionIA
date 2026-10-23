import { dressService, DressNotFoundError } from "../services/dress.service";
import { dressRepository } from "../repositories/dress.repository";
import type { Dress } from "../types/dress";

jest.mock("../repositories/dress.repository");

const mockDress: Dress = {
  id: "1",
  name: "Aurora",
  description: "desc",
  designer: "Valentina Ruiz",
  collection: "Amanecer Eterno",
  category: "Vestido de gala",
  color: "Rosa dorado",
  materials: "Tul de seda",
  imageUrl: null,
  model3dUrl: null,
  arEffectType: "particles",
  arEffectAssetUrl: "/effects/butterflies.glb",
  arEffectIntensity: 0.7,
  story: "story",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("dressService", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns all dresses", async () => {
    (dressRepository.findAll as jest.Mock).mockResolvedValue([mockDress]);
    const result = await dressService.getAll();
    expect(result).toEqual([mockDress]);
  });

  it("returns a dress by id", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(mockDress);
    const result = await dressService.getById("1");
    expect(result).toEqual(mockDress);
  });

  it("throws DressNotFoundError when the dress does not exist", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(dressService.getById("missing")).rejects.toBeInstanceOf(DressNotFoundError);
  });

  it("builds the AR effect config from the dress fields", async () => {
    (dressRepository.findById as jest.Mock).mockResolvedValue(mockDress);
    const effect = await dressService.getAREffect("1");
    expect(effect).toEqual({
      type: "particles",
      assetUrl: "/effects/butterflies.glb",
      intensity: 0.7,
    });
  });
});
