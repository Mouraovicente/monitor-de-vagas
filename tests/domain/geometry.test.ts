import { describe, it, expect } from 'vitest';
import { Rect, computeIoU, computeIntersectionArea } from '@domain/geometry';

describe('Geometry - Rect', () => {
  it('should create a rectangle with correct properties', () => {
    const rect = new Rect(10, 20, 100, 50);
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(20);
    expect(rect.w).toBe(100);
    expect(rect.h).toBe(50);
  });

  it('should compute area correctly', () => {
    const rect = new Rect(0, 0, 10, 20);
    expect(rect.area()).toBe(200);
  });
});

describe('Geometry - computeIntersectionArea', () => {
  it('should return 0 when rectangles do not overlap', () => {
    const rect1 = new Rect(0, 0, 10, 10);
    const rect2 = new Rect(20, 20, 10, 10);
    expect(computeIntersectionArea(rect1, rect2)).toBe(0);
  });

  it('should return full area when one rectangle is contained in another', () => {
    const rect1 = new Rect(0, 0, 100, 100);
    const rect2 = new Rect(10, 10, 20, 20);
    expect(computeIntersectionArea(rect1, rect2)).toBe(400);
  });

  it('should compute partial overlap correctly', () => {
    const rect1 = new Rect(0, 0, 10, 10);
    const rect2 = new Rect(5, 5, 10, 10);
    expect(computeIntersectionArea(rect1, rect2)).toBe(25);
  });

  it('should compute intersection area for touching edges (no overlap)', () => {
    const rect1 = new Rect(0, 0, 10, 10);
    const rect2 = new Rect(10, 0, 10, 10);
    expect(computeIntersectionArea(rect1, rect2)).toBe(0);
  });
});

describe('Geometry - computeIoU', () => {
  it('should return 0 when rectangles do not overlap', () => {
    const rect1 = new Rect(0, 0, 10, 10);
    const rect2 = new Rect(20, 20, 10, 10);
    expect(computeIoU(rect1, rect2)).toBe(0);
  });

  it('should return 1 when rectangles are identical', () => {
    const rect1 = new Rect(10, 10, 50, 50);
    const rect2 = new Rect(10, 10, 50, 50);
    expect(computeIoU(rect1, rect2)).toBe(1);
  });

  it('should compute IoU correctly for partial overlap', () => {
    const rect1 = new Rect(0, 0, 10, 10); // area = 100
    const rect2 = new Rect(5, 5, 10, 10); // area = 100
    // intersection = 25, union = 100 + 100 - 25 = 175
    // IoU = 25 / 175 ≈ 0.1428...
    const iou = computeIoU(rect1, rect2);
    expect(iou).toBeCloseTo(25 / 175, 4);
  });

  it('should return 1 when one rect is fully contained in another and they have same area', () => {
    const rect1 = new Rect(0, 0, 10, 10);
    const rect2 = new Rect(0, 0, 10, 10);
    expect(computeIoU(rect1, rect2)).toBe(1);
  });

  it('should compute IoU < 1 when one rect is contained but union is larger', () => {
    const rect1 = new Rect(0, 0, 100, 100); // area = 10000
    const rect2 = new Rect(10, 10, 20, 20); // area = 400
    // intersection = 400, union = 10000 + 400 - 400 = 10000
    // IoU = 400 / 10000 = 0.04
    expect(computeIoU(rect1, rect2)).toBe(0.04);
  });
});
