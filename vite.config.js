import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'frontend',
  base: '/Carousella/',   // GitHub Pages 서브경로
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
