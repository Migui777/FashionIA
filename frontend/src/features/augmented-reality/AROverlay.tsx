import type { AREffectConfig } from "../../types/dress";
import { EffectRenderer } from "./effects/EffectRenderer";

interface AROverlayProps {
  effect: AREffectConfig | null;
  dressName: string | null;
  visible: boolean;
}

export function AROverlay({ effect, dressName, visible }: AROverlayProps) {
  if (!visible || !effect) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <EffectRenderer effect={effect} dressName={dressName} />

      {dressName && effect.type !== "floating_text" && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-fade-in-up">
          <span className="glass-panel rounded-full px-4 py-1.5 font-display text-lg text-runway-gold-bright">
            {dressName}
          </span>
        </div>
      )}
    </div>
  );
}
