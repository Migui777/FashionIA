import type { Dress } from "../../types/dress";

interface DressInformationProps {
  dress: Dress;
}

export function DressInformation({ dress }: DressInformationProps) {
  const facts: Array<[string, string | null]> = [
    ["Colección", dress.collection],
    ["Categoría", dress.category],
    ["Color", dress.color],
    ["Materiales", dress.materials],
  ];

  return (
    <div className="flex flex-col gap-5 p-5">
      {dress.description && (
        <p className="text-sm leading-relaxed text-runway-mist/85">{dress.description}</p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {facts
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs tracking-wide text-runway-mist/40 uppercase">{label}</dt>
              <dd className="mt-0.5 text-sm text-runway-mist">{value}</dd>
            </div>
          ))}
      </dl>

      {dress.story && (
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="mb-1.5 font-display text-lg text-runway-gold-bright">
            Historia y concepto
          </h3>
          <p className="text-sm leading-relaxed text-runway-mist/80">{dress.story}</p>
        </div>
      )}
    </div>
  );
}
