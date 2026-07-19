import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: [
      './src/test/**',
      './src/**/*.gen.ts',
      './src/**/*.d.ts',
      './src/**/*.test.ts',
      './src/**/*.test.tsx',
      './src/**/*.spec.ts',
      './src/**/*.spec.tsx',
    ],
  },
])
