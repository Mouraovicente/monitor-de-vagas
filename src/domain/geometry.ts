/**
 * Rectangle representation with x, y, width, height
 */
export class Rect {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly w: number,
    readonly h: number
  ) {}

  /**
   * Computes the area of the rectangle
   */
  area(): number {
    return this.w * this.h;
  }
}

/**
 * Computes the area of intersection between two rectangles
 * @param rect1 First rectangle
 * @param rect2 Second rectangle
 * @returns Intersection area
 */
export function computeIntersectionArea(rect1: Rect, rect2: Rect): number {
  const x1 = Math.max(rect1.x, rect2.x);
  const y1 = Math.max(rect1.y, rect2.y);
  const x2 = Math.min(rect1.x + rect1.w, rect2.x + rect2.w);
  const y2 = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);

  const width = Math.max(0, x2 - x1);
  const height = Math.max(0, y2 - y1);

  return width * height;
}

/**
 * Computes the Intersection over Union (IoU) between two rectangles
 * @param rect1 First rectangle
 * @param rect2 Second rectangle
 * @returns IoU value between 0 and 1
 */
export function computeIoU(rect1: Rect, rect2: Rect): number {
  const intersection = computeIntersectionArea(rect1, rect2);
  const union = rect1.area() + rect2.area() - intersection;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}
