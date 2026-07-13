import { Rect, computeIoU } from './geometry';

/**
 * Represents a parking zone with its bounding rectangle
 */
export interface Zone {
  id: string;
  rect: Rect;
}

/**
 * Represents a vehicle detection from the detector
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
 * Configuration for occupancy computation
 */
export interface OccupancyConfig {
  iouThreshold: number;
  scoreThreshold: number;
  vehicleClasses: string[];
}

/**
 * Occupancy status of a parking zone
 */
export type OccupancyStatus = 'FREE' | 'OCCUPIED';

/**
 * Computes the occupancy status of all zones based on vehicle detections
 * @param zones Array of parking zones
 * @param detections Array of vehicle detections
 * @param config Configuration for occupancy computation
 * @returns Map of zone ID to occupancy status
 */
export function computeOccupancy(
  zones: Zone[],
  detections: Detection[],
  config: OccupancyConfig
): Map<string, OccupancyStatus> {
  const result = new Map<string, OccupancyStatus>();

  // Initialize all zones as FREE
  for (const zone of zones) {
    result.set(zone.id, 'FREE');
  }

  // Filter detections by score and vehicle class
  const validDetections = detections.filter(
    (det) =>
      det.score >= config.scoreThreshold &&
      config.vehicleClasses.includes(det.class)
  );

  // Check each zone against all valid detections
  for (const zone of zones) {
    for (const detection of validDetections) {
      const detectionRect = new Rect(detection.x, detection.y, detection.w, detection.h);
      const iou = computeIoU(zone.rect, detectionRect);

      if (iou >= config.iouThreshold) {
        result.set(zone.id, 'OCCUPIED');
        break; // Zone is occupied, no need to check other detections
      }
    }
  }

  return result;
}
