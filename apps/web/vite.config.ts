import type { Plugin } from 'vite'

import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const emitNotFoundHtml = (): Plugin => ({
  name: 'emit-404-html',
  apply: 'build',
  closeBundle: () => {
    const dist = new URL('./dist/', import.meta.url)
    copyFileSync(
      fileURLToPath(new URL('index.html', dist)),
      fileURLToPath(new URL('404.html', dist)),
    )
  },
})

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
      routeFileIgnorePattern: '\\.test\\.',
    }),
    react(),
    lingui(),
    babel({
      presets: [linguiTransformerBabelPreset()],
    }),
    emitNotFoundHtml(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/trpc': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/trpc/, ''),
      },
    },
  },
})
