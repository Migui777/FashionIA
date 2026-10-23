import { lazy, Suspense } from "react";
import type { AREffectConfig } from "../../../types/dress";

// three.js pesa varios cientos de KB — se carga solo cuando de verdad
// aparece un efecto model_3d, no en el bundle inicial de la PWA.
const Model3DEffect = lazy(() =>
  import("./Model3DEffect").then((m) => ({ default: m.Model3DEffect })),
);

interface EffectRendererProps {
  effect: AREffectConfig | null;
  dressName?: string | null;
}

// Para "floating_text" el nombre del vestido ES el efecto. Para el resto de
// tipos ya se muestra fuera de este componente (ver AROverlay), así que aquí
// solo se dibuja el efecto visual en sí, sin repetir la etiqueta.
export function EffectRenderer({ effect, dressName }: EffectRendererProps) {
  if (!effect) return null;

  const opacity = 0.35 + effect.intensity * 0.65;

  if (effect.type === "glow") {
    return (
      <div
        data-testid="effect-glow"
        aria-label="Glow effect"
        className="absolute inset-0 animate-pulse"
        style={{
          opacity,
          background: `radial-gradient(circle at 50% 50%, rgba(212,175,122,${0.25 + effect.intensity * 0.4}) 0%, rgba(212,175,122,${0.08 + effect.intensity * 0.2}) 25%, transparent 60%)`,
          boxShadow: `inset 0 0 ${40 + effect.intensity * 100}px rgba(212,175,122,${0.18 + effect.intensity * 0.5})`,
        }}
      />
    );
  }

  if (effect.type === "particles") {
    const particles = Array.from({ length: 18 }, (_, index) => ({
      id: `${effect.type}-${index}`,
      left: `${(index * 11) % 100}%`,
      top: `${(index * 17) % 100}%`,
      delay: `${index * 0.14}s`,
      size: 6 + ((index % 5) * 3),
    }));

    return (
      <div data-testid="effect-particles" aria-label="Particles effect" className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full bg-amber-200/80 animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: opacity * 0.8,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect.type === "frame") {
    return (
      <div
        data-testid="effect-frame"
        aria-label="Frame effect"
        className="absolute inset-6 sm:inset-10"
        style={{ opacity }}
      >
        <div className="absolute left-0 top-0 h-12 w-12 border-l-2 border-t-2 border-amber-300/80" />
        <div className="absolute right-0 top-0 h-12 w-12 border-r-2 border-t-2 border-amber-300/80" />
        <div className="absolute bottom-0 left-0 h-12 w-12 border-b-2 border-l-2 border-amber-300/80" />
        <div className="absolute bottom-0 right-0 h-12 w-12 border-b-2 border-r-2 border-amber-300/80" />
      </div>
    );
  }

  if (effect.type === "floating_text") {
    return (
      <div
        data-testid="effect-floating-text"
        aria-label="Floating text effect"
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity }}
      >
        <span className="animate-fade-in-up font-display text-4xl tracking-[0.28em] text-white/90 sm:text-5xl">
          {dressName ?? "Runway"}
        </span>
      </div>
    );
  }

  if (effect.type === "model_3d") {
    return (
      <Suspense fallback={null}>
        <Model3DEffect assetUrl={effect.assetUrl} intensity={effect.intensity} />
      </Suspense>
    );
  }

  return (
    <div
      data-testid="effect-generic"
      aria-label="Generic effect"
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity }}
    >
      <div className="rounded-full border border-dashed border-amber-200/60 px-5 py-2 text-sm tracking-[0.2em] text-amber-100/80 uppercase">
        {effect.type}
      </div>
    </div>
  );
}
