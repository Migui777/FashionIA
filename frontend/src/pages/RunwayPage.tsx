import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CameraView } from "../features/camera/CameraView";
import { useCamera } from "../features/camera/useCamera";
import { AROverlay } from "../features/augmented-reality/AROverlay";
import { ScanIndicator } from "../features/augmented-reality/ScanIndicator";
import { useDressScanner } from "../features/augmented-reality/useDressScanner";
import { DressCarousel } from "../features/dresses/DressCarousel";
import { useAppStore } from "../store/useAppStore";
import type { Dress } from "../types/dress";

export function RunwayPage() {
  const navigate = useNavigate();
  const { videoRef, status, errorMessage, requestCamera } = useCamera();

  const dresses = useAppStore((state) => state.dresses);
  const detectedDressIds = useAppStore((state) => state.detectedDressIds);
  const selectDress = useAppStore((state) => state.selectDress);

  const detectedDresses = useMemo(
    () => detectedDressIds.map((id) => dresses.find((d) => d.id === id)).filter(Boolean) as Dress[],
    [detectedDressIds, dresses],
  );

  const { scanState, lastDetectedDress } = useDressScanner({
    videoRef,
    dresses,
    active: status === "granted",
  });

  const handleSelect = (dress: Dress) => {
    selectDress(dress.id);
    navigate(`/dresses/${dress.id}`);
  };

  return (
    <div className="relative flex h-full min-h-full flex-col bg-runway-black">
      <div className="relative flex-1 overflow-hidden">
        {status === "granted" && <CameraView videoRef={videoRef} />}

        {status === "granted" && (
          <>
            <AROverlay
              effect={
                lastDetectedDress
                  ? {
                      type: lastDetectedDress.arEffectType,
                      assetUrl: lastDetectedDress.arEffectAssetUrl,
                      intensity: lastDetectedDress.arEffectIntensity,
                    }
                  : null
              }
              dressName={scanState === "detected" ? lastDetectedDress?.name ?? null : null}
              visible={scanState === "detected"}
            />
            <ScanIndicator state={scanState} detectedName={lastDetectedDress?.name} />
          </>
        )}

        {status !== "granted" && (
          <CameraPermissionGate
            status={status}
            errorMessage={errorMessage}
            onRequest={requestCamera}
          />
        )}
      </div>

      <DressCarousel dresses={detectedDresses} onSelect={handleSelect} />
    </div>
  );
}

interface CameraPermissionGateProps {
  status: string;
  errorMessage: string | null;
  onRequest: () => void;
}

function CameraPermissionGate({ status, errorMessage, onRequest }: CameraPermissionGateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      {status === "idle" && (
        <>
          <h2 className="font-display text-2xl text-runway-mist">Activa tu cámara</h2>
          <p className="max-w-xs text-sm text-runway-mist/60">
            Necesitamos acceso a tu cámara para mostrarte los efectos de realidad aumentada sobre
            la pasarela. No se guarda ni se envía ningún video.
          </p>
          <button
            onClick={onRequest}
            className="rounded-full bg-runway-gold px-8 py-3 font-medium text-runway-black active:scale-95"
          >
            Activar cámara
          </button>
        </>
      )}

      {status === "requesting" && (
        <p className="text-sm text-runway-mist/60">Solicitando permiso de cámara...</p>
      )}

      {(status === "denied" || status === "unsupported" || status === "error") && (
        <>
          <h2 className="font-display text-2xl text-runway-mist">No pudimos activar la cámara</h2>
          <p className="max-w-xs text-sm text-runway-mist/60">{errorMessage}</p>
          {status === "denied" && (
            <button
              onClick={onRequest}
              className="rounded-full border border-runway-gold/50 px-8 py-3 font-medium text-runway-gold-bright active:scale-95"
            >
              Intentar de nuevo
            </button>
          )}
        </>
      )}
    </div>
  );
}
