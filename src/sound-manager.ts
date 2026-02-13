import { Howl } from 'howler';

export class SoundManager {
  private scratchSound: Howl | null = null;
  private celebrationSound: Howl | null = null;

  constructor() {
    try {
      // 使用公共免版權音效網址作為示範
      this.scratchSound = new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
        loop: true,
        volume: 0.3,
        onloaderror: () => this.scratchSound = null,
        onplayerror: () => this.scratchSound?.unlock()
      });

      this.celebrationSound = new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'],
        volume: 0.6,
        onloaderror: () => this.celebrationSound = null
      });
    } catch (e) {
      console.warn('音效系統初始化失敗', e);
    }
  }

  public playScratch() {
    if (this.scratchSound && !this.scratchSound.playing()) {
      this.scratchSound.play();
    }
  }

  public stopScratch() {
    if (this.scratchSound) {
      this.scratchSound.stop();
    }
  }

  public playCelebration() {
    if (this.celebrationSound) {
      this.celebrationSound.play();
    }
  }
}
