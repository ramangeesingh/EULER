import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    watch: {
      // Exclude cloned repo directories from Vite's file watcher.
      // Cloned repos contain tsconfig.json, index.html, vite.config.ts, etc.
      // which would otherwise trigger Vite full-page reloads during analysis.
      ignored: [
        // Safety net for old temp/repos path inside project root
        path.resolve(__dirname, 'temp/**'),
        // New clone path outside project root
        path.join(os.homedir(), 'EulerRepos', '**'),
      ],
    },
  },
})

