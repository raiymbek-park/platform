import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'ui',
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      fileURLToPath(new URL('../../vitest.setup.ts', import.meta.url)),
    ],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
