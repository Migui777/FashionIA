import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
}

interface ParticlesEffectProps {
  intensity: number;
}

export function ParticlesEffect({ intensity }: ParticlesEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const count = Math.round(24 * Math.min(Math.max(intensity, 0.1), 1));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * height,
      radius: 1.5 + Math.random() * 2.5,
      speed: 0.4 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 0.6,
      opacity: 0.4 + Math.random() * 0.6,
    }));

    let frameId: number;
    const onResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(240, 217, 168, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
