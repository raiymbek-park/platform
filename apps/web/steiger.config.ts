import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['./src/test/**', './src/**/*.gen.ts', './src/**/*.d.ts'],
  },
  {
    // Cohesive onboarding vertical slice; gains more references in #4 (verify
    // reads the same store/keys). The single-reference heuristic is a false
    // positive here.
    files: ['./src/features/onboarding/registration-form/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // otp-verify reads the onboarding draft/pendingPhone written by
    // registration-form via its public API — they form one onboarding vertical
    // sharing a single persisted store. The cross-import is intentional here.
    files: ['./src/features/onboarding/otp-verify/**'],
    rules: {
      'fsd/forbidden-imports': 'off',
    },
  },
])
