import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/renderer/src/**/*.spec.js', 'src/renderer/src/**/*.test.js'],
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  }
})
