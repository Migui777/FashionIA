import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setErrorMessage("Este navegador no soporta el acceso a la cámara.");
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setStatus("granted");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setStatus("denied");
        setErrorMessage("Necesitamos permiso de cámara para mostrarte la experiencia AR.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setStatus("unsupported");
        setErrorMessage("No se encontró ninguna cámara en este dispositivo.");
      } else {
        setStatus("error");
        setErrorMessage("Ocurrió un error al intentar acceder a la cámara.");
      }
    }
  }, []);

  // The <video> element only mounts once status is "granted", so the stream
  // can only be attached here, after that render has committed — not inside
  // requestCamera, where videoRef.current is still null.
  useEffect(() => {
    if (status !== "granted" || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [status]);

  useEffect(() => stopCamera, [stopCamera]);

  return { videoRef, status, errorMessage, requestCamera, stopCamera };
}
