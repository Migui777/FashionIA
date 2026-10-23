import type { ScanState } from "./useDressScanner";

interface ScanIndicatorProps {
  state: ScanState;
  detectedName?: string | null;
}

export function ScanIndicator({ state, detectedName }: ScanIndicatorProps) {
  if (state === "idle") return null;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2">
      <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-sm">
        {state === "scanning" && (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-runway-gold-bright" />
            <span className="tracking-wide text-runway-mist/90">Escaneando pasarela...</span>
          </>
        )}
        {state === "detected" && (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="tracking-wide text-runway-gold-bright">
              Vestido detectado{detectedName ? `: ${detectedName}` : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
