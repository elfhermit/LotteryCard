/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/LotteryCard/',
  test: {
    environment: 'jsdom',
  },
});
