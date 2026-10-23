interface FloatingTextEffectProps {
  text: string;
}

export function FloatingTextEffect({ text }: FloatingTextEffectProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-shimmer animate-fade-in-up font-display text-4xl tracking-wide sm:text-5xl">
        {text}
      </span>
    </div>
  );
}
