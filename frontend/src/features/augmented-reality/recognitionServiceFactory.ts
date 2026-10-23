import type { DressRecognitionService } from "./DressRecognitionService";
import { MockDressRecognitionService } from "./MockDressRecognitionService";

/**
 * Only "mock" is implemented for this MVP. Future providers (MediaPipeDressRecognitionService,
 * TensorFlowDressRecognitionService, ExternalAIDressRecognitionService) can be selected here
 * without touching the components or hooks that consume DressRecognitionService.
 */
export function createDressRecognitionService(dressIds: string[]): DressRecognitionService {
  return new MockDressRecognitionService(dressIds);
}
