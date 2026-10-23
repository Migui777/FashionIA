import { dressRepository } from "../repositories/dress.repository";
import type { AREffectConfig, Dress } from "../types/dress";

export class DressNotFoundError extends Error {
  constructor(id: string) {
    super(`Dress with id "${id}" was not found`);
    this.name = "DressNotFoundError";
  }
}

export const dressService = {
  async getAll(): Promise<Dress[]> {
    return dressRepository.findAll();
  },

  async getById(id: string): Promise<Dress> {
    const dress = await dressRepository.findById(id);
    if (!dress) throw new DressNotFoundError(id);
    return dress;
  },

  async getAREffect(id: string): Promise<AREffectConfig> {
    const dress = await this.getById(id);
    return {
      type: dress.arEffectType,
      assetUrl: dress.arEffectAssetUrl,
      intensity: dress.arEffectIntensity,
    };
  },
};
