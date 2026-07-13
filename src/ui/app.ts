import { Zone } from '@domain/occupancy';
import { OccupancyStatus, computeOccupancy } from '@domain/occupancy';
import { createZone } from '@domain/zones';
import { StorageAdapter } from '@infrastructure/storage';
import { Detector, Detection } from '@infrastructure/detector';

/**
 * Application state and logic for parking zone monitoring
 */
export class ParkingMonitorApp {
  private zones: Zone[] = [];
  private currentDetections: Detection[] = [];
  private occupancyStatus: Map<string, OccupancyStatus> = new Map();
  private isEditing = false;

  constructor(
    private storage: StorageAdapter,
    private detector: Detector
  ) {
    this.loadZones();
  }

  /**
   * Load zones from storage
   */
  private loadZones(): void {
    this.zones = this.storage.getZones();
  }

  /**
   * Add a new zone
   */
  addZone(x: number, y: number, w: number, h: number): Zone {
    const zone = createZone(x, y, w, h);
    this.zones.push(zone);
    this.storage.saveZones(this.zones);
    return zone;
  }

  /**
   * Remove a zone by ID
   */
  removeZone(zoneId: string): void {
    this.zones = this.zones.filter((z) => z.id !== zoneId);
    this.storage.saveZones(this.zones);
  }

  /**
   * Get all zones
   */
  getZones(): Zone[] {
    return this.zones;
  }

  /**
   * Clear all zones
   */
  clearZones(): void {
    this.zones = [];
    this.occupancyStatus.clear();
    this.storage.clearZones();
  }

  /**
   * Get current detections
   */
  getDetections(): Detection[] {
    return this.currentDetections;
  }

  /**
   * Update detections (called from detection loop)
   */
  setDetections(detections: Detection[]): void {
    this.currentDetections = detections;
    this.updateOccupancy();
  }

  /**
   * Update occupancy status based on current detections
   */
  private updateOccupancy(): void {
    this.occupancyStatus = computeOccupancy(this.zones, this.currentDetections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });
  }

  /**
   * Get occupancy status for all zones
   */
  getOccupancyStatus(): Map<string, OccupancyStatus> {
    return this.occupancyStatus;
  }

  /**
   * Get occupancy count
   */
  getOccupancyCount(): { occupied: number; free: number } {
    let occupied = 0;
    let free = 0;

    for (const status of this.occupancyStatus.values()) {
      if (status === 'OCCUPIED') {
        occupied++;
      } else {
        free++;
      }
    }

    return { occupied, free };
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): boolean {
    this.isEditing = !this.isEditing;
    return this.isEditing;
  }

  /**
   * Get current edit mode
   */
  isInEditMode(): boolean {
    return this.isEditing;
  }

  /**
   * Detect objects in video frame
   */
  async detectFrame(videoElement: HTMLVideoElement): Promise<Detection[]> {
    const detections = await this.detector.detect(videoElement);
    this.setDetections(detections);
    return detections;
  }
}
