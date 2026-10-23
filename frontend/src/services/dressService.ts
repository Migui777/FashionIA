import { api } from "./api";
import type { AREffectConfig, Dress } from "../types/dress";

export const dressService = {
  getAll(): Promise<Dress[]> {
    return api.get<Dress[]>("/dresses");
  },

  getById(id: string): Promise<Dress> {
    return api.get<Dress>(`/dresses/${id}`);
  },

  getAREffect(id: string): Promise<AREffectConfig> {
    return api.get<AREffectConfig>(`/dresses/${id}/ar-effect`);
  },
};
