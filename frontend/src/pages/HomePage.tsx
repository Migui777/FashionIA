import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dressService } from "../services/dressService";
import { useAppStore } from "../store/useAppStore";

type LoadState = "loading" | "ready" | "error";

export function HomePage() {
  const navigate = useNavigate();
  const setDresses = useAppStore((state) => state.setDresses);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [cameraSupported, setCameraSupported] = useState(true);
  const [pwaSupported, setPwaSupported] = useState(true);

  useEffect(() => {
    setCameraSupported(Boolean(navigator.mediaDevices?.getUserMedia));
    setPwaSupported("serviceWorker" in navigator);

    dressService
      .getAll()
      .then((dresses) => {
        setDresses(dresses);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [setDresses]);

  return (
    <div className="relative flex min-h-full flex-col items-center justify-between overflow-hidden bg-runway-black px-6 py-10 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(212,175,122,0.18), transparent 55%), radial-gradient(circle at 20% 80%, rgba(232,201,201,0.1), transparent 50%)",
        }}
      />

      <div className="relative z-10 mt-16 flex flex-col items-center gap-3 animate-fade-in-up">
        <div className="h-14 w-14 rounded-full border border-runway-gold/50" />
        <h1 className="text-shimmer font-display text-5xl tracking-wide">Fashion AR</h1>
        <p className="max-w-xs text-sm text-runway-mist/60">
          Realidad aumentada para vivir la pasarela desde tu cámara
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in-up">
        <div className="flex gap-4 text-xs text-runway-mist/50">
          <StatusPill ok={cameraSupported} label="Cámara" />
          <StatusPill ok={pwaSupported} label="PWA" />
          <StatusPill ok={loadState !== "error"} label="Colección" />
        </div>

        <button
          onClick={() => navigate("/runway")}
          disabled={loadState === "loading"}
          className="rounded-full bg-runway-gold px-8 py-3.5 font-medium tracking-wide text-runway-black transition-transform active:scale-95 disabled:opacity-40"
        >
          {loadState === "loading" ? "Preparando experiencia..." : "Entrar a la pasarela"}
        </button>

        {loadState === "error" && (
          <p className="max-w-xs text-xs text-red-400">
            No pudimos conectar con el servidor. Puedes continuar, algunos vestidos podrían no
            cargar.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
      {label}
    </span>
  );
}
