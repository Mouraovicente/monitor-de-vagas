import { describe, it, expect } from 'vitest';
import { createZone, serializeZones, deserializeZones } from '@domain/zones';

describe('Zones', () => {
  it('should create a zone with stable ID', () => {
    const zone = createZone(10, 20, 100, 50);
    expect(zone.id).toBeDefined();
    expect(typeof zone.id).toBe('string');
    expect(zone.rect.x).toBe(10);
    expect(zone.rect.y).toBe(20);
    expect(zone.rect.w).toBe(100);
    expect(zone.rect.h).toBe(50);
  });

  it('should create zones with different IDs', () => {
    const zone1 = createZone(0, 0, 50, 50);
    const zone2 = createZone(100, 100, 50, 50);
    expect(zone1.id).not.toBe(zone2.id);
  });

  it('should serialize zones to JSON', () => {
    const zone = createZone(10, 20, 100, 50);
    const serialized = serializeZones([zone]);
    const parsed = JSON.parse(serialized);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('id');
    expect(parsed[0]).toHaveProperty('rect');
    expect(parsed[0].rect).toHaveProperty('x', 10);
    expect(parsed[0].rect).toHaveProperty('y', 20);
    expect(parsed[0].rect).toHaveProperty('w', 100);
    expect(parsed[0].rect).toHaveProperty('h', 50);
  });

  it('should deserialize zones from JSON', () => {
    const zone = createZone(10, 20, 100, 50);
    const serialized = serializeZones([zone]);
    const deserialized = deserializeZones(serialized);

    expect(deserialized.length).toBe(1);
    expect(deserialized[0].id).toBe(zone.id);
    expect(deserialized[0].rect.x).toBe(10);
    expect(deserialized[0].rect.y).toBe(20);
    expect(deserialized[0].rect.w).toBe(100);
    expect(deserialized[0].rect.h).toBe(50);
  });

  it('should perform roundtrip serialization/deserialization', () => {
    const zone1 = createZone(0, 0, 50, 50);
    const zone2 = createZone(100, 100, 50, 50);
    const zones = [zone1, zone2];

    const serialized = serializeZones(zones);
    const deserialized = deserializeZones(serialized);

    expect(deserialized.length).toBe(2);
    expect(deserialized[0].id).toBe(zone1.id);
    expect(deserialized[1].id).toBe(zone2.id);
  });

  it('should maintain stable IDs after reload', () => {
    const zone = createZone(50, 50, 60, 60);
    const originalId = zone.id;

    const serialized = serializeZones([zone]);
    const deserialized = deserializeZones(serialized);

    expect(deserialized[0].id).toBe(originalId);
  });

  it('should handle empty zones array', () => {
    const serialized = serializeZones([]);
    const deserialized = deserializeZones(serialized);

    expect(deserialized).toEqual([]);
  });
});
