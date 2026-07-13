import { ParkingMonitorApp } from './app';
import { CanvasDrawer } from './draw';
import { createStorageAdapter } from '@infrastructure/storage';
import { createDetector } from '@infrastructure/detector';

/**
 * Main application initialization
 */
class Application {
  private app: ParkingMonitorApp;
  private drawer: CanvasDrawer;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private detectionInterval: number | null = null;
  private drawInterval: number | null = null;
  private currentVideoStream: MediaStream | null = null;

  constructor() {
    this.videoElement = document.getElementById('video') as HTMLVideoElement;
    this.canvasElement = document.getElementById('overlay-canvas') as HTMLCanvasElement;

    const storage = createStorageAdapter(window.localStorage);
    const detector = createDetector();

    this.app = new ParkingMonitorApp(storage, detector);
    this.drawer = new CanvasDrawer(
      this.canvasElement,
      (x, y, w, h) => this.handleZoneCreated(x, y, w, h)
    );

    this.setupEventListeners();
    this.startDrawLoop();
    this.updateUI();
  }

  /**
   * Setup event listeners for UI controls
   */
  private setupEventListeners(): void {
    // Webcam button
    document.getElementById('btn-webcam')?.addEventListener('click', () => {
      this.startWebcam();
    });

    // File input
    document.getElementById('file-input')?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      this.loadVideoFile(input.files?.[0]);
    });

    // Toggle edit mode
    document.getElementById('btn-toggle-edit')?.addEventListener('click', () => {
      this.toggleEditMode();
    });

    // Clear zones
    document.getElementById('btn-clear-zones')?.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja remover todas as vagas?')) {
        this.app.clearZones();
        this.updateUI();
      }
    });

    // Handle video metadata
    this.videoElement.addEventListener('loadedmetadata', () => {
      this.drawer.setSize(this.videoElement.videoWidth, this.videoElement.videoHeight);
      this.startDetectionLoop();
    });
  }

  /**
   * Start webcam video stream
   */
  private async startWebcam(): Promise<void> {
    try {
      // Stop previous stream if exists
      if (this.currentVideoStream) {
        this.currentVideoStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      this.currentVideoStream = stream;
      this.videoElement.srcObject = stream;
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Erro ao acessar a câmera. Verifique as permissões.');
    }
  }

  /**
   * Load video from file
   */
  private loadVideoFile(file?: File): void {
    if (!file) return;

    const url = URL.createObjectURL(file);
    this.videoElement.src = url;

    // Stop webcam stream if exists
    if (this.currentVideoStream) {
      this.currentVideoStream.getTracks().forEach((track) => track.stop());
      this.currentVideoStream = null;
    }
  }

  /**
   * Toggle edit mode
   */
  private toggleEditMode(): void {
    const isEditing = this.app.toggleEditMode();
    this.drawer.setEditMode(isEditing);
    this.updateUI();
  }

  /**
   * Handle zone creation from canvas
   */
  private handleZoneCreated(x: number, y: number, w: number, h: number): void {
    this.app.addZone(x, y, w, h);
    this.updateUI();
  }

  /**
   * Start detection loop (runs at ~500ms interval)
   */
  private startDetectionLoop(): void {
    if (this.detectionInterval !== null) {
      clearInterval(this.detectionInterval);
    }

    this.detectionInterval = window.setInterval(() => {
      if (!this.videoElement.paused && !this.videoElement.ended) {
        this.app.detectFrame(this.videoElement).catch((error) => {
          console.error('Erro na detecção:', error);
        });
      }
    }, 500);
  }

  /**
   * Start draw loop (runs at ~60fps)
   */
  private startDrawLoop(): void {
    const draw = () => {
      this.drawer.clear();

      const zones = this.app.getZones();
      const occupancyMap = this.app.getOccupancyStatus();
      const detections = this.app.getDetections();

      this.drawer.drawZones(zones, occupancyMap);
      this.drawer.drawDetections(detections);
      this.drawer.drawPreview();

      this.drawInterval = requestAnimationFrame(draw);
    };

    draw();
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    const { occupied, free } = this.app.getOccupancyCount();
    const isEditing = this.app.isInEditMode();

    // Update counters
    document.getElementById('free-count')!.textContent = free.toString();
    document.getElementById('occupied-count')!.textContent = occupied.toString();

    // Update mode indicator
    const modeIndicator = document.getElementById('mode-indicator')!;
    if (isEditing) {
      modeIndicator.textContent = 'Modo: Edição';
      modeIndicator.classList.add('editing');
    } else {
      modeIndicator.textContent = 'Modo: Visualização';
      modeIndicator.classList.remove('editing');
    }

    // Update zones list
    this.updateZonesList();
  }

  /**
   * Update zones list in control panel
   */
  private updateZonesList(): void {
    const container = document.getElementById('zones-container')!;
    const zones = this.app.getZones();
    const occupancyMap = this.app.getOccupancyStatus();

    if (zones.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma vaga configurada.</p>
          <p>Ative o modo edição e desenhe retângulos no vídeo.</p>
        </div>
      `;
      return;
    }

    const zonesHtml = zones
      .map((zone) => {
        const status = occupancyMap.get(zone.id) || 'FREE';
        const statusClass = status === 'OCCUPIED' ? 'occupied' : 'free';
        const statusText = status === 'OCCUPIED' ? 'OCUPADA' : 'LIVRE';

        return `
          <div class="zone-item">
            <div class="zone-info">
              <div class="zone-id">${zone.id.substring(0, 12)}...</div>
              <span class="zone-status ${statusClass}">${statusText}</span>
            </div>
            <button class="zone-remove" data-zone-id="${zone.id}">Remover</button>
          </div>
        `;
      })
      .join('');

    container.innerHTML = `<div class="zones-list">${zonesHtml}</div>`;

    // Add event listeners to remove buttons
    container.querySelectorAll('.zone-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const zoneId = (e.target as HTMLElement).getAttribute('data-zone-id');
        if (zoneId) {
          this.app.removeZone(zoneId);
          this.updateUI();
        }
      });
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.detectionInterval !== null) {
      clearInterval(this.detectionInterval);
    }
    if (this.drawInterval !== null) {
      cancelAnimationFrame(this.drawInterval);
    }
    if (this.currentVideoStream) {
      this.currentVideoStream.getTracks().forEach((track) => track.stop());
    }
  }
}

// Initialize application when DOM is ready
let app: Application;

document.addEventListener('DOMContentLoaded', () => {
  app = new Application();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app?.destroy();
});
