import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['./src/test/**', './src/**/*.gen.ts', './src/**/*.d.ts'],
  },
  {
    files: ['./src/features/onboarding/registration-form/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    files: ['./src/features/onboarding/otp-verification/**'],
    rules: {
      'fsd/forbidden-imports': 'off',
      'fsd/insignificant-slice': 'off',
    },
  },
])
