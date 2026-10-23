import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dressService } from "../services/dressService";
import { DressHero } from "../features/dresses/DressHero";
import { DressInformation } from "../features/dresses/DressInformation";
import { DressChat } from "../features/chat/DressChat";
import type { Dress } from "../types/dress";

type LoadState = "loading" | "ready" | "not-found";

export function DressDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dress, setDress] = useState<Dress | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!id) return;
    setLoadState("loading");
    dressService
      .getById(id)
      .then((d) => {
        setDress(d);
        setLoadState("ready");
      })
      .catch(() => setLoadState("not-found"));
  }, [id]);

  if (loadState === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-runway-mist/50">Cargando vestido...</p>
      </div>
    );
  }

  if (loadState === "not-found" || !dress) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-runway-mist/60">No pudimos encontrar este vestido.</p>
        <button
          onClick={() => navigate("/runway")}
          className="rounded-full border border-runway-gold/50 px-6 py-2.5 text-sm text-runway-gold-bright"
        >
          Volver a la pasarela
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-runway-black">
      <button
        onClick={() => navigate(-1)}
        className="glass-panel absolute top-4 left-4 z-10 rounded-full px-3.5 py-1.5 text-sm text-runway-mist"
      >
        ← Volver
      </button>

      <DressHero dress={dress} />
      <DressInformation dress={dress} />

      <div className="p-5 pt-0">
        <DressChat dressId={dress.id} />
      </div>
    </div>
  );
}
