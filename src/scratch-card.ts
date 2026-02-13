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
      coverColor: '#C0C0C0', // 標準銀色
      brushSize: 40, // 加大刷頭
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
    
    // 快速純色填充，優化效能
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.options.coverColor;
    this.ctx.fillRect(0, 0, width, height);

    // 簡單文字提示，避免複雜渲染
    this.ctx.fillStyle = '#555555';
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('請在此刮開', width / 2, height / 2 + 7);

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

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  private getPos(e: MouseEvent | TouchEvent) {
    const rect = this.options.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (this.options.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.options.canvas.height / rect.height)
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
    // 效能優化：只檢查 1/16 的像素點進行估算
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const step = 16; // 跨步取樣

    for (let i = 3; i < pixels.length; i += step) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const progress = (transparentPixels * (step / 4)) / (width * height);
    this.options.onProgress(progress);

    if (progress > 0.85) {
        this.reveal();
    }
  }

  public reveal() {
    const { width, height } = this.options.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.options.onComplete();
  }
}
