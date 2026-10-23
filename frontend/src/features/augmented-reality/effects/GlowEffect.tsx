interface GlowEffectProps {
  intensity: number;
}

export function GlowEffect({ intensity }: GlowEffectProps) {
  return (
    <div
      className="absolute inset-0 animate-pulse"
      style={{
        background: `radial-gradient(circle at 50% 55%, rgba(212,175,122,${0.28 * intensity}) 0%, transparent 60%)`,
        boxShadow: `inset 0 0 ${80 * intensity}px rgba(212,175,122,${0.35 * intensity})`,
      }}
    />
  );
}
