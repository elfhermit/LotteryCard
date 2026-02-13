export interface ScratchCardOptions {
  canvas: HTMLCanvasElement;
  coverColor?: string;
  brushSize?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onScratchStart?: () => void;
  onScratchEnd?: () => void;
}

export class ScratchCard {
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private options: Required<ScratchCardOptions>;
  private lastX = 0;
  private lastY = 0;

  constructor(options: ScratchCardOptions) {
    this.options = {
      coverColor: '#CCCCCC',
      brushSize: 30,
      onProgress: () => {},
      onComplete: () => {},
      onScratchStart: () => {},
      onScratchEnd: () => {},
      ...options
    };

    const context = this.options.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.init();
  }

  private init() {
    this.reset();
    this.attachEvents();
  }

  public reset() {
    const { width, height } = this.options.canvas;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.options.coverColor;
    this.ctx.fillRect(0, 0, width, height);

    // Add some "scratch here" text or pattern if needed
    this.ctx.fillStyle = '#999999';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('刮開有驚喜', width / 2, height / 2 + 7);

    this.ctx.globalCompositeOperation = 'destination-out';
  }

  private attachEvents() {
    const canvas = this.options.canvas;

    const start = (e: MouseEvent | TouchEvent) => {
      this.isDrawing = true;
      const pos = this.getPos(e);
      this.lastX = pos.x;
      this.lastY = pos.y;
      this.draw(pos.x, pos.y);
      this.options.onScratchStart();
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = this.getPos(e);
      this.draw(pos.x, pos.y);
      this.lastX = pos.x;
      this.lastY = pos.y;
    };

    const end = () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.options.onScratchEnd();
      this.calculateProgress();
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    window.addEventListener('touchend', end);
  }

  private getPos(e: MouseEvent | TouchEvent) {
    const rect = this.options.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private draw(x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.options.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  public calculateProgress() {
    const { width, height } = this.options.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const progress = transparentPixels / (width * height);
    this.options.onProgress(progress);

    if (progress > 0.9) {
        this.reveal();
    }
  }

  public reveal() {
    const { width, height } = this.options.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.options.onComplete();
  }
}
