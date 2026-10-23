export interface DressDetection {
  dressId: string;
  confidence: number;
}

export interface DressRecognitionService {
  detect(frame: ImageData): Promise<DressDetection[]>;
}
