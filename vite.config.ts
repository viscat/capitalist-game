/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path dels assets. En desenvolupament sempre des de l'arrel. En build, per
// defecte sota /capitalist-game/ (GitHub Pages), però es pot sobreescriure amb la
// variable d'entorn BASE_PATH per autoallotjar-lo a l'arrel d'un host (Proxmox,
// Docker...): `BASE_PATH=/ npm run build`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/capitalist-game/') : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}))
