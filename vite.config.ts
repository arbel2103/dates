import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Stamps the build time into the service worker.
 *
 * A browser only installs a new service worker when the file's bytes differ
 * from the one it already has. Without a stamp `sw.js` is identical on every
 * deploy, no new worker is ever installed, and the home-screen app keeps
 * serving the old build until it happens to be cold-started. The stamp is the
 * whole update mechanism.
 */
function stampServiceWorker(): Plugin {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    writeBundle(options) {
      const file = resolve(options.dir ?? 'dist', 'sw.js')
      const source = readFileSync(file, 'utf8')
      writeFileSync(file, source.replace(/__BUILD__/g, new Date().toISOString()))
    },
  }
}

// base '/dates/' so the built site works when hosted at
// https://<user>.github.io/dates/
export default defineConfig({
  base: '/dates/',
  plugins: [react(), stampServiceWorker()],
})
