import { useEffect, useRef, useState } from "react";

interface TypedTextProps {
  text: string;
  /** Fragmento que se resalta (por ejemplo, el nombre de la prenda). */
  highlight?: string | null;
  /** Se llama en cada avance para mantener el scroll al final. */
  onTick?: () => void;
  onDone?: () => void;
  /** false mientras el texto sigue llegando: no se llama a onDone hasta que sea true. */
  complete?: boolean;
}

const STEP_MS = 14;
const CHARS_PER_STEP = 2;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function renderHighlighted(text: string, highlight?: string | null) {
  if (!highlight) return text;
  const index = text.indexOf(highlight);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + highlight.length)}</mark>
      {text.slice(index + highlight.length)}
    </>
  );
}

/** Muestra el texto letra por letra, como si el asistente lo estuviera escribiendo. */
export function TypedText({ text, highlight, onTick, onDone, complete = true }: TypedTextProps) {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  const callbacks = useRef({ onTick, onDone });
  useEffect(() => {
    callbacks.current = { onTick, onDone };
  });

  useEffect(() => {
    if (count >= text.length) {
      if (complete) callbacks.current.onDone?.();
      return;
    }
    const timer = setTimeout(() => {
      setCount((c) => Math.min(text.length, c + CHARS_PER_STEP));
      callbacks.current.onTick?.();
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [count, text, complete]);

  return (
    <>
      {renderHighlighted(text.slice(0, count), highlight)}
      {count < text.length && <span className="at-caret" aria-hidden="true" />}
    </>
  );
}
