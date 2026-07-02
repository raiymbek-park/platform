import { defineConfig } from '@lingui/conf'

export default defineConfig({
  sourceLocale: 'ru',
  locales: ['ru', 'kk', 'en'],
  catalogs: [
    {
      path: '<rootDir>/src/shared/i18n/locales/{locale}/messages',
      include: ['<rootDir>/src'],
    },
  ],
})
