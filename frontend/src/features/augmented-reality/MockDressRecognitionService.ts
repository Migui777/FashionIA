import type { DressDetection, DressRecognitionService } from "./DressRecognitionService";

/**
 * Simulates a real computer-vision model: it ignores the actual pixel data and
 * "detects" one dress after the camera has been held steady for a few frames.
 * Swap this for MediaPipeDressRecognitionService / TensorFlowDressRecognitionService /
 * ExternalAIDressRecognitionService later without touching the rest of the app.
 */
export class MockDressRecognitionService implements DressRecognitionService {
  private readonly dressIds: string[];
  private readonly ticksToDetect: number;
  private ticks = 0;
  private cursor = 0;

  constructor(dressIds: string[], ticksToDetect = 6) {
    this.dressIds = dressIds;
    this.ticksToDetect = ticksToDetect;
  }

  async detect(_frame: ImageData): Promise<DressDetection[]> {
    if (this.dressIds.length === 0) return [];

    this.ticks += 1;
    if (this.ticks < this.ticksToDetect) return [];

    this.ticks = 0;
    const dressId = this.dressIds[this.cursor % this.dressIds.length];
    this.cursor += 1;

    return [{ dressId, confidence: 0.86 + Math.random() * 0.12 }];
  }
}
