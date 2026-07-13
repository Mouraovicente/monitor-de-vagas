import { Zone } from '@domain/occupancy';
import { serializeZones, deserializeZones } from '@domain/zones';

const STORAGE_KEY = 'parking-zones';

/**
 * Interface for storage operations on parking zones
 */
export interface StorageAdapter {
  /**
   * Get all saved zones
   */
  getZones(): Zone[];

  /**
   * Save zones to storage
   */
  saveZones(zones: Zone[]): void;

  /**
   * Clear all zones from storage
   */
  clearZones(): void;
}

/**
 * Creates a storage adapter using browser localStorage
 * @param storage Storage object (usually window.localStorage)
 * @returns StorageAdapter implementation
 */
export function createStorageAdapter(storage: Storage): StorageAdapter {
  return {
    getZones(): Zone[] {
      const json = storage.getItem(STORAGE_KEY);
      if (!json) {
        return [];
      }
      return deserializeZones(json);
    },

    saveZones(zones: Zone[]): void {
      const json = serializeZones(zones);
      storage.setItem(STORAGE_KEY, json);
    },

    clearZones(): void {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
