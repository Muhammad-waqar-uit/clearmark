import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    root: './',
    // .js test files are stale duplicates of the .ts sources; only the typed copies run.
    exclude: ['**/*.js'],
  },
})