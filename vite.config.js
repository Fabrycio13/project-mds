import { defineConfig } from 'vite'

export default defineConfig({
  // Keep the original MVP and the lightweight portfolio demo as separate pages.
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        demo: 'demo.html'
      }
    }
  }
})
