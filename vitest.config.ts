import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '~/components': fileURLToPath(new URL('./app/components', import.meta.url)),
      '~/composables': fileURLToPath(new URL('./app/composables', import.meta.url)),
      '~/pages': fileURLToPath(new URL('./app/pages', import.meta.url)),
      '~/types': fileURLToPath(new URL('./app/types', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
