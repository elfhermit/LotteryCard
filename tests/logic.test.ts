import { describe, it, expect, beforeEach, vi } from 'vitest';
import config from '../src/config.json';
import { ScratchCard } from '../src/scratch-card';

describe('Lottery Card Advanced Logic', () => {
  it('should have 50 blessings in config', () => {
    expect(config.blessings).toHaveLength(50);
  });

  describe('LocalStorage Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save and load collected blessings', () => {
      const blessing = '馬到成功';
      const collection = JSON.parse(localStorage.getItem('lottery_collection') || '[]');
      collection.push(blessing);
      localStorage.setItem('lottery_collection', JSON.stringify(collection));
      
      const saved = JSON.parse(localStorage.getItem('lottery_collection') || '[]');
      expect(saved).toContain(blessing);
    });
  });

  describe('ScratchCard Progress Calculation', () => {
    let canvas: HTMLCanvasElement;
    
    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
    });

    it('should calculate progress > 0.98 for cleanliness king', () => {
      const onProgress = vi.fn();
      const card = new ScratchCard({ canvas, onProgress });
      
      // 直接操作像素模擬完全刮除
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 100, 100);
      
      card.calculateProgress();
      const progress = onProgress.mock.calls[0][0];
      expect(progress).toBeGreaterThan(0.98);
    });
  });
});
