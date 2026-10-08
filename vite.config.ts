import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages sert le site sous /gallerie-d-art-jacmel/ (build et preview) ; le dev reste à la racine.
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: command === 'build' || isPreview ? '/gallerie-d-art-jacmel/' : '/',
}))
