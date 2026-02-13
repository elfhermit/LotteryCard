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
  private isRevealed = false;
  private soundManager: SoundManager;

  constructor() {
    this.soundManager = new SoundManager();
    this.initUI();
    this.setupGame();
  }

  private initUI() {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
      <h1>馬年大吉刮刮樂</h1>
      <div class="card-container">
        <div id="blessing" class="blessing-text"></div>
        <canvas id="scratch-canvas" width="300" height="200"></canvas>
      </div>
      <button id="reset-btn" class="btn">再來一張</button>
    `;

    this.blessingElement = document.getElementById('blessing')!;
    this.canvas = document.getElementById('scratch-canvas') as HTMLCanvasElement;
    this.resetButton = document.getElementById('reset-btn') as HTMLButtonElement;

    this.resetButton.addEventListener('click', () => this.setupGame());
  }

  private setupGame() {
    this.isRevealed = false;
    const blessings = typedConfig.blessings;
    const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];
    this.blessingElement.textContent = randomBlessing;

    if (!this.scratchCard) {
      this.scratchCard = new ScratchCard({
        canvas: this.canvas,
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
        onScratchStart: () => this.soundManager.playScratch(),
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
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#ffffff', '#ff0000']
    });
  }
}

new App();
