import { Zone } from '@domain/occupancy';
import { Detection } from '@infrastructure/detector';

/**
 * Canvas drawing utilities for zones and detections
 */
export class CanvasDrawer {
  private ctx: CanvasRenderingContext2D;
  private isEditing = false;
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private previewRect: { x: number; y: number; w: number; h: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private onZoneCreated?: (x: number, y: number, w: number, h: number) => void
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  /**
   * Setup canvas event listeners for zone editing
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
  }

  /**
   * Handle mouse down event
   */
  private handleMouseDown(e: MouseEvent): void {
    if (!this.isEditing) return;

    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.dragging = true;
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isEditing || !this.dragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(this.startX, currentX);
    const y = Math.min(this.startY, currentY);
    const w = Math.abs(currentX - this.startX);
    const h = Math.abs(currentY - this.startY);

    this.previewRect = { x, y, w, h };
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(e: MouseEvent): void {
    if (!this.isEditing || !this.dragging) return;

    this.dragging = false;

    if (this.previewRect && this.previewRect.w > 10 && this.previewRect.h > 10) {
      this.onZoneCreated?.(
        this.previewRect.x,
        this.previewRect.y,
        this.previewRect.w,
        this.previewRect.h
      );
    }

    this.previewRect = null;
  }

  /**
   * Handle mouse leave event
   */
  private handleMouseLeave(): void {
    if (this.isEditing) {
      this.dragging = false;
      this.previewRect = null;
    }
  }

  /**
   * Set edit mode
   */
  setEditMode(editing: boolean): void {
    this.isEditing = editing;
    this.canvas.classList.toggle('view-mode', !editing);
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw zones with occupancy status
   */
  drawZones(zones: Zone[], occupancyMap: Map<string, 'FREE' | 'OCCUPIED'>): void {
    for (const zone of zones) {
      const status = occupancyMap.get(zone.id);
      const color = status === 'OCCUPIED' ? '#ef4444' : '#22c55e';
      const alpha = status === 'OCCUPIED' ? 0.5 : 0.3;

      // Draw filled rectangle
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);

      // Draw border
      this.ctx.globalAlpha = 1;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);

      // Draw zone ID
      this.ctx.fillStyle = color;
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.fillText(zone.id.substring(0, 8), zone.rect.x + 4, zone.rect.y + 16);
    }
  }

  /**
   * Draw detections as bounding boxes
   */
  drawDetections(detections: Detection[]): void {
    for (const det of detections) {
      const color = '#64b5f6';

      // Draw border only (no fill)
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = 0.7;
      this.ctx.strokeRect(det.x, det.y, det.w, det.h);

      // Draw score
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 1;
      this.ctx.font = '10px sans-serif';
      this.ctx.fillText(`${(det.score * 100).toFixed(0)}%`, det.x + 2, det.y + 10);
    }
  }

  /**
   * Draw preview rectangle while dragging (in edit mode)
   */
  drawPreview(): void {
    if (!this.previewRect || !this.isEditing) return;

    const { x, y, w, h } = this.previewRect;

    // Draw filled rectangle
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillRect(x, y, w, h);

    // Draw border
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);
  }

  /**
   * Set canvas size to match video dimensions
   */
  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
