import { useEffect, useRef, useState, type RefObject } from "react";
import type { Dress } from "../../types/dress";
import type { DressRecognitionService } from "./DressRecognitionService";
import { createDressRecognitionService } from "./recognitionServiceFactory";
import { useAppStore } from "../../store/useAppStore";

export type ScanState = "idle" | "scanning" | "detected";

const SCAN_INTERVAL_MS = 500;
const DETECTED_BANNER_MS = 3000;
const FRAME_SIZE = 64;

interface UseDressScannerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  dresses: Dress[];
  active: boolean;
}

export function useDressScanner({ videoRef, dresses, active }: UseDressScannerOptions) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [lastDetectedDress, setLastDetectedDress] = useState<Dress | null>(null);

  const serviceRef = useRef<DressRecognitionService | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const addDetectedDress = useAppStore((state) => state.addDetectedDress);

  useEffect(() => {
    if (dresses.length > 0 && !serviceRef.current) {
      serviceRef.current = createDressRecognitionService(dresses.map((d) => d.id));
    }
  }, [dresses]);

  useEffect(() => {
    if (!active || !serviceRef.current) return;

    setScanState((prev) => (prev === "idle" ? "scanning" : prev));

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = FRAME_SIZE;
    canvas.height = FRAME_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let cancelled = false;
    let bannerTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      const service = serviceRef.current;
      if (!video || !service || !ctx || video.readyState < 2) return;

      ctx.drawImage(video, 0, 0, FRAME_SIZE, FRAME_SIZE);
      const frame = ctx.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE);
      const detections = await service.detect(frame);
      if (cancelled || detections.length === 0) return;

      const dress = dresses.find((d) => d.id === detections[0].dressId);
      if (!dress) return;

      setLastDetectedDress(dress);
      setScanState("detected");
      addDetectedDress(dress.id);

      clearTimeout(bannerTimeout);
      bannerTimeout = setTimeout(() => {
        if (!cancelled) setScanState("scanning");
      }, DETECTED_BANNER_MS);
    }, SCAN_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(bannerTimeout);
    };
  }, [active, videoRef, dresses, addDetectedDress]);

  return { scanState, lastDetectedDress };
}
