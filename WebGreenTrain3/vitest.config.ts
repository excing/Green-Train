import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  },
  resolve: {
    alias: {
      $lib: '/src/lib'
    }
  }
});

