import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))
const fromRoot = (path: string): string => resolve(root, path)

/** Copies manifest.json and the icons into dist/ once the bundle is written. */
function copyExtensionFiles(): Plugin {
  return {
    name: 'clearmark-copy-extension-files',
    closeBundle(): void {
      copyFileSync(fromRoot('manifest.json'), fromRoot('dist/manifest.json'))
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        manager: fromRoot('src/manager/index.html'),
        popup: fromRoot('src/popup/index.html'),
        options: fromRoot('src/options/index.html'),
        'service-worker': fromRoot('src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunk): string =>
          chunk.name === 'service-worker' ? 'service-worker.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo): string => {
          const names = assetInfo.names ?? []
          return names.some((name) => name.endsWith('.css'))
            ? 'assets/styles-[hash][extname]'
            : 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
