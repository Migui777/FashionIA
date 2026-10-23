import type { Dress } from "../../types/dress";

interface DetectedDressCardProps {
  dress: Dress;
  onSelect: (dress: Dress) => void;
}

export function DetectedDressCard({ dress, onSelect }: DetectedDressCardProps) {
  return (
    <button
      onClick={() => onSelect(dress)}
      className="glass-panel flex w-32 shrink-0 flex-col overflow-hidden rounded-xl text-left transition-transform active:scale-95 sm:w-40"
    >
      <div className="aspect-[3/4] w-full overflow-hidden bg-runway-ink">
        {dress.imageUrl && (
          <img src={dress.imageUrl} alt={dress.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <span className="font-display text-lg leading-tight text-runway-mist">{dress.name}</span>
        {dress.designer && (
          <span className="truncate text-xs text-runway-mist/60">{dress.designer}</span>
        )}
        <span className="mt-1 text-xs font-medium text-runway-gold-bright">Ver más →</span>
      </div>
    </button>
  );
}
