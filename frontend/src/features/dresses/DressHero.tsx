import type { Dress } from "../../types/dress";

interface DressHeroProps {
  dress: Dress;
}

export function DressHero({ dress }: DressHeroProps) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-runway-ink">
      {dress.imageUrl && (
        <img src={dress.imageUrl} alt={dress.name} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-runway-black via-runway-black/60 to-transparent p-5 pt-16">
        <h1 className="font-display text-4xl text-runway-mist">{dress.name}</h1>
        {dress.designer && (
          <p className="mt-1 text-sm tracking-wide text-runway-gold-bright">{dress.designer}</p>
        )}
      </div>
    </div>
  );
}
