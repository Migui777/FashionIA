import type { RefObject } from "react";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function CameraView({ videoRef }: CameraViewProps) {
  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      playsInline
      muted
      autoPlay
    />
  );
}
