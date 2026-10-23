interface FrameEffectProps {
  intensity: number;
}

const cornerBase =
  "absolute h-10 w-10 border-runway-gold-bright/80 transition-opacity animate-fade-in-up";

export function FrameEffect({ intensity }: FrameEffectProps) {
  return (
    <div className="absolute inset-6 sm:inset-10" style={{ opacity: 0.5 + intensity * 0.5 }}>
      <div className={`${cornerBase} top-0 left-0 border-t-2 border-l-2`} />
      <div className={`${cornerBase} top-0 right-0 border-t-2 border-r-2`} />
      <div className={`${cornerBase} bottom-0 left-0 border-b-2 border-l-2`} />
      <div className={`${cornerBase} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}
