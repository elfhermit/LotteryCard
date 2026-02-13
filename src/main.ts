import './style.css';
import config from './config.json';
import { ScratchCard } from './scratch-card';
import { SoundManager } from './sound-manager';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

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
  private collectionElement!: HTMLElement;
  private titleElement!: HTMLElement;
  private isRevealed = false;
  private isGoldMode = false;
  private clickCount = 0;
  private lastClickTime = 0;
  private soundManager: SoundManager;
  private collectedBlessings: Set<string> = new Set();

  constructor() {
    try {
      this.soundManager = new SoundManager();
      this.checkEveMode();
      this.loadCollection();
      this.initDecorations();
      this.initUI();
      this.setupGame();
    } catch (err) {
      this.handleGlobalError(err);
    }
  }

  private handleGlobalError(err: any) {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (app) {
      app.innerHTML = `
        <div style="background: white; color: black; padding: 20px; border-radius: 10px; text-align: left;">
          <h3 style="color: red;">初始化發生錯誤</h3>
          <p>請嘗試重新整理網頁。若問題持續，請將以下資訊提供給開發者：</p>
          <pre style="font-size: 12px; overflow: auto;">${err.message}\n${err.stack}</pre>
        </div>
      `;
    }
  }

  private checkEveMode() {
    const now = new Date();
    // 簡單判定：如果是除夕 (通常在 1月或 2月) - 這裡以 2026/2/16 為除夕範例
    // 實際產品可串接農曆轉換庫
    const month = now.getMonth() + 1;
    const date = now.getDate();
    if (month === 2 && (date === 16 || date === 17)) {
      document.body.classList.add('eve-mode');
    }
  }

  private loadCollection() {
    const saved = localStorage.getItem('lottery_collection');
    if (saved) {
      this.collectedBlessings = new Set(JSON.parse(saved));
    }
  }

  private saveCollection(blessing: string) {
    this.collectedBlessings.add(blessing);
    localStorage.setItem('lottery_collection', JSON.stringify(Array.from(this.collectedBlessings)));
    this.updateCollectionUI();
  }

  private updateCollectionUI() {
    if (this.collectionElement) {
      this.collectionElement.textContent = `已蒐集: ${this.collectedBlessings.size} / ${typedConfig.blessings.length}`;
    }
  }

  private initUI() {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
      <div id="collection-info" class="collection-info"></div>
      <h1 id="main-title">🧧 駿馬迎春</h1>
      <p class="subtitle">刮出您的馬年專屬福氣</p>
      
      <div id="capture-area" class="card-outer">
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
    this.collectionElement = document.getElementById('collection-info')!;
    this.titleElement = document.getElementById('main-title')!;

    this.updateCollectionUI();

    this.resetButton.addEventListener('click', () => {
      this.setupGame();
      if ('vibrate' in navigator) navigator.vibrate(20);
    });

    this.shareButton.addEventListener('click', () => this.handleShare());
    
    this.titleElement.addEventListener('click', () => this.handleTitleClick());
  }

  private handleTitleClick() {
    const now = Date.now();
    if (now - this.lastClickTime < 500) {
      this.clickCount++;
    } else {
      this.clickCount = 1;
    }
    this.lastClickTime = now;

    if (this.clickCount === 5) {
      this.triggerGoldMode();
    }
  }

  private triggerGoldMode() {
    this.isGoldMode = true;
    document.body.classList.add('gold-mode');
    this.titleElement.textContent = '✨ 黃金馬年 ✨';
    this.setupGame();
    confetti({ particleCount: 150, spread: 100, colors: ['#ffd700'] });
  }

  private setupGame() {
    this.isRevealed = false;
    let blessing = '';
    
    if (this.isGoldMode) {
      blessing = "✨ 恭喜解鎖隱藏大吉：黃金萬兩馬上有！ ✨";
      this.isGoldMode = false; // 用完一次即恢復
      setTimeout(() => {
        document.body.classList.remove('gold-mode');
        this.titleElement.textContent = '🧧 駿馬迎春';
      }, 5000);
    } else {
      const blessings = typedConfig.blessings;
      blessing = blessings[Math.floor(Math.random() * blessings.length)];
    }
    
    this.blessingElement.textContent = blessing;

    if (!this.scratchCard) {
      this.scratchCard = new ScratchCard({
        canvas: this.canvas,
        coverColor: '#bfbcbc',
        brushSize: 35,
        onProgress: (progress) => {
          if (progress > typedConfig.settings.celebrationThreshold && !this.isRevealed) {
            this.revealSuccess(progress);
          }
        },
        onComplete: () => {
          if (!this.isRevealed) {
            this.revealSuccess(1.0);
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

  private revealSuccess(progress: number) {
    this.isRevealed = true;
    this.scratchCard.reveal();
    this.playCelebration();
    this.soundManager.playCelebration();
    this.saveCollection(this.blessingElement.textContent || '');

    if (progress > 0.98) {
      setTimeout(() => {
        alert('🏆 潔癖王！您的堅持令人敬佩！祝您今年運勢也一樣順順利利！');
      }, 500);
    }
  }

  private async handleShare() {
    if (!this.isRevealed) {
      alert('先刮開好運再分享吧！');
      return;
    }

    const captureArea = document.getElementById('capture-area')!;
    
    try {
      const canvas = await html2canvas(captureArea, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });
      
      const image = canvas.toDataURL('image/png');
      const currentBlessing = this.blessingElement.textContent || '馬到成功';
      
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], 'lucky-card.png', { type: 'image/png' });
        
        await navigator.share({
          title: '馬年大吉刮刮樂',
          text: `我在馬年刮刮樂刮到了：『${currentBlessing}』！`,
          files: [file],
        });
      } else {
        // PC 端或不支援檔案分享時，觸發下載
        const link = document.createElement('a');
        link.download = `馬年刮刮樂-${currentBlessing}.png`;
        link.href = image;
        link.click();
      }
    } catch (err) {
      // 靜默處理分享失敗，避免污染 console
    }
  }
}

new App();
