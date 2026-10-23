import type { Dress } from "../../types/dress";
import { DetectedDressCard } from "./DetectedDressCard";

interface DressCarouselProps {
  dresses: Dress[];
  onSelect: (dress: Dress) => void;
}

export function DressCarousel({ dresses, onSelect }: DressCarouselProps) {
  return (
    <div className="glass-panel rounded-t-3xl px-4 pt-4 pb-6">
      <h2 className="mb-3 font-display text-xl text-runway-mist">Vestidos encontrados</h2>

      {dresses.length === 0 ? (
        <p className="pb-2 text-sm text-runway-mist/60">
          Apunta la cámara a la pasarela para empezar a descubrir vestidos.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {dresses.map((dress) => (
            <DetectedDressCard key={dress.id} dress={dress} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
