import { Rect } from './geometry';
import { Zone } from './occupancy';

/**
 * Serializable zone representation
 */
interface SerializedZone {
  id: string;
  rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Creates a new zone with a stable ID based on timestamp and random component
 * @param x X coordinate
 * @param y Y coordinate
 * @param w Width
 * @param h Height
 * @returns Zone with stable ID
 */
export function createZone(x: number, y: number, w: number, h: number): Zone {
  const id = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    rect: new Rect(x, y, w, h),
  };
}

/**
 * Serializes zones to JSON string
 * @param zones Array of zones
 * @returns JSON string
 */
export function serializeZones(zones: Zone[]): string {
  const serialized: SerializedZone[] = zones.map((zone) => ({
    id: zone.id,
    rect: {
      x: zone.rect.x,
      y: zone.rect.y,
      w: zone.rect.w,
      h: zone.rect.h,
    },
  }));
  return JSON.stringify(serialized);
}

/**
 * Deserializes zones from JSON string
 * @param json JSON string
 * @returns Array of zones
 */
export function deserializeZones(json: string): Zone[] {
  if (!json || json.trim() === '') {
    return [];
  }

  try {
    const serialized: SerializedZone[] = JSON.parse(json);
    return serialized.map((zone) => ({
      id: zone.id,
      rect: new Rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h),
    }));
  } catch {
    return [];
  }
}
