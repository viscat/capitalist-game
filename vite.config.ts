/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En build (GitHub Pages) servim sota /capitalist-game/; en local, des de l'arrel.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/capitalist-game/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
}))
