import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['./src/test/**', './src/**/*.gen.ts', './src/**/*.d.ts'],
  },
  {
    files: ['./src/**/*.server.test.tsx'],
    rules: {
      'fsd/no-public-api-sidestep': 'off',
    },
  },
])
