import './style.css';
import config from './config.json';
import { ScratchCard } from './scratch-card';
import { SoundManager } from './sound-manager';
import confetti from 'canvas-confetti';

interface Config {
  blessings: string[];
  settings: {
    threshold: number;
    celebrationThreshold: number;
  };
}

const typedConfig = config as Config;

class App {
  private scratchCard!: ScratchCard;
  private blessingElement!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private resetButton!: HTMLButtonElement;
  private shareButton!: HTMLButtonElement;
  private isRevealed = false;
  private soundManager: SoundManager;

  constructor() {
    this.soundManager = new SoundManager();
    this.initDecorations();
    this.initUI();
    this.setupGame();
  }

  private initDecorations() {
    // 加入燈籠裝飾
    const lanternSVG = `
      <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="45" y="0" width="10" height="20" fill="#ffd700"/>
        <ellipse cx="50" cy="60" rx="40" ry="45" fill="#d32f2f" stroke="#ffd700" stroke-width="3"/>
        <line x1="50" y1="15" x2="50" y2="105" stroke="#ffd700" stroke-width="2"/>
        <line x1="25" y1="30" x2="25" y2="90" stroke="#ffd700" stroke-width="1" opacity="0.5"/>
        <line x1="75" y1="30" x2="75" y2="90" stroke="#ffd700" stroke-width="1" opacity="0.5"/>
        <rect x="30" y="105" width="40" height="10" fill="#ffd700"/>
      </svg>
    `;

    const leftLantern = document.createElement('div');
    leftLantern.className = 'decoration lantern lantern-left';
    leftLantern.innerHTML = lanternSVG;
    
    const rightLantern = document.createElement('div');
    rightLantern.className = 'decoration lantern lantern-right';
    rightLantern.innerHTML = lanternSVG;

    document.body.appendChild(leftLantern);
    document.body.appendChild(rightLantern);
  }

  private initUI() {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
      <h1>🧧 駿馬迎春</h1>
      <p class="subtitle">刮出您的馬年專屬福氣</p>
      
      <div class="card-outer">
        <div class="card-container">
          <div id="blessing" class="blessing-text"></div>
          <canvas id="scratch-canvas" width="320" height="220"></canvas>
        </div>
      </div>

      <div class="button-group">
        <button id="reset-btn" class="btn btn-main">再來一張</button>
        <button id="share-btn" class="btn btn-share">分享好運</button>
      </div>
    `;

    this.blessingElement = document.getElementById('blessing')!;
    this.canvas = document.getElementById('scratch-canvas') as HTMLCanvasElement;
    this.resetButton = document.getElementById('reset-btn') as HTMLButtonElement;
    this.shareButton = document.getElementById('share-btn') as HTMLButtonElement;

    this.resetButton.addEventListener('click', () => {
      this.setupGame();
      // 點擊回饋：震動
      if ('vibrate' in navigator) navigator.vibrate(20);
    });

    this.shareButton.addEventListener('click', () => this.handleShare());
  }

  private setupGame() {
    this.isRevealed = false;
    const blessings = typedConfig.blessings;
    const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];
    this.blessingElement.textContent = randomBlessing;

    if (!this.scratchCard) {
      this.scratchCard = new ScratchCard({
        canvas: this.canvas,
        coverColor: '#bfbcbc', // 銀灰色覆蓋層
        brushSize: 35,
        onProgress: (progress) => {
          if (progress > typedConfig.settings.celebrationThreshold && !this.isRevealed) {
            this.revealSuccess();
          }
        },
        onComplete: () => {
          if (!this.isRevealed) {
            this.revealSuccess();
          }
        },
        onScratchStart: () => {
          this.soundManager.playScratch();
          if ('vibrate' in navigator) navigator.vibrate(5);
        },
        onScratchEnd: () => this.soundManager.stopScratch()
      });
    } else {
      this.scratchCard.reset();
    }
  }

  private revealSuccess() {
    this.isRevealed = true;
    this.scratchCard.reveal();
    this.playCelebration();
    this.soundManager.playCelebration();
  }

  private playCelebration() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }

  private async handleShare() {
    const text = `我在馬年刮刮樂刮到了：『${this.blessingElement.textContent}』！快來試試你的手氣！`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '馬年大吉刮刮樂',
          text: text,
          url: url,
        });
      } catch (err) {
        console.log('分享取消或失敗', err);
      }
    } else {
      // 不支援 Web Share API 時的備案 (複製到剪貼簿)
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('已複製好運訊息，快去傳給朋友吧！');
    }
  }
}

new App();
