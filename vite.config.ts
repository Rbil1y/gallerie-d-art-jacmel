import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le site est servi à la racine de son domaine (galeridajakmel.aylab.co, réglé dans GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: '/',
})
