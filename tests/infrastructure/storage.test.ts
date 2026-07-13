import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageAdapter, createStorageAdapter } from '@infrastructure/storage';
import { createZone } from '@domain/zones';

// Mock localStorage
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('Storage Adapter', () => {
  let mockStorage: MockLocalStorage;
  let adapter: StorageAdapter;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    adapter = createStorageAdapter(mockStorage as unknown as Storage);
  });

  it('should save and retrieve zones', () => {
    const zone = createZone(10, 20, 100, 50);
    adapter.saveZones([zone]);

    const retrieved = adapter.getZones();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe(zone.id);
  });

  it('should return empty array when no zones are saved', () => {
    const zones = adapter.getZones();
    expect(zones).toEqual([]);
  });

  it('should overwrite previous zones', () => {
    const zone1 = createZone(0, 0, 50, 50);
    adapter.saveZones([zone1]);

    const zone2 = createZone(100, 100, 50, 50);
    adapter.saveZones([zone2]);

    const retrieved = adapter.getZones();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe(zone2.id);
  });

  it('should handle multiple zones', () => {
    const zone1 = createZone(0, 0, 50, 50);
    const zone2 = createZone(100, 100, 50, 50);
    const zone3 = createZone(200, 200, 50, 50);

    adapter.saveZones([zone1, zone2, zone3]);

    const retrieved = adapter.getZones();
    expect(retrieved.length).toBe(3);
    expect(retrieved[0].id).toBe(zone1.id);
    expect(retrieved[1].id).toBe(zone2.id);
    expect(retrieved[2].id).toBe(zone3.id);
  });

  it('should clear zones', () => {
    const zone = createZone(10, 20, 100, 50);
    adapter.saveZones([zone]);

    adapter.clearZones();

    const retrieved = adapter.getZones();
    expect(retrieved).toEqual([]);
  });

  it('should handle corrupted storage data gracefully', () => {
    mockStorage.setItem('parking-zones', 'invalid json');

    const retrieved = adapter.getZones();
    expect(retrieved).toEqual([]);
  });
});
