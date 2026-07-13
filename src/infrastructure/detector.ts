/**
 * Detection result from the detector
 */
export interface Detection {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  class: string;
}

/**
 * Port interface for vehicle detection
 */
export interface Detector {
  /**
   * Detects vehicles in a video frame
   * @param videoElement Video element to detect from
   * @returns Promise resolving to array of detections
   */
  detect(videoElement: HTMLVideoElement): Promise<Detection[]>;
}

/**
 * COCO-SSD adapter implementation
 */
export class CocoSsdDetector implements Detector {
  private model: any = null;
  private isLoading = false;

  async loadModel(): Promise<void> {
    if (this.model !== null || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      const tf = await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');

      // Ensure TensorFlow is initialized
      await tf.ready();

      this.model = await cocoSsd.load();
    } finally {
      this.isLoading = false;
    }
  }

  async detect(videoElement: HTMLVideoElement): Promise<Detection[]> {
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      return [];
    }

    try {
      const predictions = await this.model.estimateObjects(videoElement, {
        maxDetections: 100,
      });

      // Filter for relevant vehicle classes and map to our format
      const vehicleClasses = ['car', 'truck', 'motorcycle', 'bus'];

      return predictions
        .filter((pred: any) => vehicleClasses.includes(pred.class))
        .map((pred: any) => ({
          x: Math.round(pred.bbox[0]),
          y: Math.round(pred.bbox[1]),
          w: Math.round(pred.bbox[2]),
          h: Math.round(pred.bbox[3]),
          score: pred.score,
          class: pred.class,
        }));
    } catch {
      return [];
    }
  }
}

/**
 * Creates a COCO-SSD detector instance
 */
export function createDetector(): Detector {
  return new CocoSsdDetector();
}
