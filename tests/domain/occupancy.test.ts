import { describe, it, expect } from 'vitest';
import { computeOccupancy } from '@domain/occupancy';
import { Rect } from '@domain/geometry';

interface Detection {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  class: string;
}

describe('Occupancy Engine', () => {
  it('should mark all zones as FREE when no detections', () => {
    const zones = [
      { id: '1', rect: new Rect(0, 0, 50, 50) },
      { id: '2', rect: new Rect(100, 0, 50, 50) },
    ];
    const detections: Detection[] = [];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('FREE');
    expect(result.get('2')).toBe('FREE');
  });

  it('should ignore detections with low score', () => {
    const zones = [{ id: '1', rect: new Rect(0, 0, 50, 50) }];
    const detections: Detection[] = [
      {
        x: 10,
        y: 10,
        w: 30,
        h: 30,
        score: 0.3, // below threshold
        class: 'car',
      },
    ];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('FREE');
  });

  it('should ignore non-vehicle classes', () => {
    const zones = [{ id: '1', rect: new Rect(0, 0, 50, 50) }];
    const detections: Detection[] = [
      {
        x: 10,
        y: 10,
        w: 30,
        h: 30,
        score: 0.8,
        class: 'person', // not a vehicle
      },
    ];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('FREE');
  });

  it('should mark zone as OCCUPIED when IoU >= threshold', () => {
    const zones = [{ id: '1', rect: new Rect(0, 0, 50, 50) }];
    const detections: Detection[] = [
      {
        x: 10,
        y: 10,
        w: 30,
        h: 30, // IoU with zone will be >= 0.25
        score: 0.8,
        class: 'car',
      },
    ];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('OCCUPIED');
  });

  it('should mark zone as FREE when IoU < threshold', () => {
    const zones = [{ id: '1', rect: new Rect(0, 0, 50, 50) }];
    const detections: Detection[] = [
      {
        x: 100,
        y: 100,
        w: 20,
        h: 20, // far from zone, IoU will be 0
        score: 0.8,
        class: 'car',
      },
    ];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('FREE');
  });

  it('should handle multiple detections covering multiple zones', () => {
    const zones = [
      { id: '1', rect: new Rect(0, 0, 50, 50) },
      { id: '2', rect: new Rect(60, 0, 50, 50) },
    ];
    const detections: Detection[] = [
      {
        x: 10,
        y: 10,
        w: 100, // large detection covering both zones
        h: 30,
        score: 0.8,
        class: 'truck',
      },
    ];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('OCCUPIED');
    expect(result.get('2')).toBe('OCCUPIED');
  });

  it('should mark zone as OCCUPIED if any valid detection overlaps sufficiently', () => {
    const zones = [{ id: '1', rect: new Rect(0, 0, 100, 100) }];
    const detections: Detection[] = [
      {
        x: 20,
        y: 20,
        w: 60,
        h: 60, // IoU will be >= 0.25
        score: 0.6,
        class: 'car',
      },
      {
        x: 200,
        y: 200,
        w: 30,
        h: 30,
        score: 0.9,
        class: 'motorcycle', // far from zone
      },
    ];

    const result = computeOccupancy(zones, detections, {
      iouThreshold: 0.25,
      scoreThreshold: 0.5,
      vehicleClasses: ['car', 'truck', 'motorcycle', 'bus'],
    });

    expect(result.get('1')).toBe('OCCUPIED');
  });
});
