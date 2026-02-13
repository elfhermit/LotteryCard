import { Howl } from 'howler';

export class SoundManager {
  private scratchSound: Howl | null = null;
  private celebrationSound: Howl | null = null;

  constructor() {
    // These paths assume files are in the public folder
    this.scratchSound = new Howl({
      src: ['/sounds/scratch.mp3'],
      loop: true,
      volume: 0.5
    });

    this.celebrationSound = new Howl({
      src: ['/sounds/celebration.mp3'],
      volume: 0.8
    });
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
