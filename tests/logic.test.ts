import { describe, it, expect, beforeEach, vi } from 'vitest';
import config from '../src/config.json';
import { ScratchCard } from '../src/scratch-card';

describe('Lottery Card Logic', () => {
  it('should have 10 blessings in config', () => {
    expect(config.blessings).toHaveLength(10);
    expect(config.blessings).toContain('馬到成功');
  });

  describe('ScratchCard', () => {
    let canvas: HTMLCanvasElement;
    
    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      // Mock getContext if needed, but jsdom usually provides a basic one
      // If it doesn't support getImageData, we might need a more complex mock
    });

    it('should initialize and reset canvas', () => {
      const card = new ScratchCard({ canvas });
      expect(card).toBeDefined();
      
      const ctx = canvas.getContext('2d')!;
      // destination-out should be set after reset
      expect(ctx.globalCompositeOperation).toBe('destination-out');
    });

    it('should calculate progress (mocked)', () => {
      const onProgress = vi.fn();
      const card = new ScratchCard({ canvas, onProgress });
      
      card.calculateProgress();
      expect(onProgress).toHaveBeenCalled();
      const progress = onProgress.mock.calls[0][0];
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });
});
