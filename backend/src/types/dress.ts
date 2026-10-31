export type AREffectType = "particles" | "glow" | "floating_text" | "model_3d" | "frame";

export interface Dress {
  id: string;
  name: string;
  description: string | null;
  designer: string | null;
  collection: string | null;
  category: string | null;
  color: string | null;
  materials: string | null;
  imageUrl: string | null;
  model3dUrl: string | null;
  arEffectType: AREffectType;
  arEffectAssetUrl: string | null;
  arEffectIntensity: number;
  story: string | null;
  style: string | null;
  season: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AREffectConfig {
  type: AREffectType;
  assetUrl: string | null;
  intensity: number;
}
