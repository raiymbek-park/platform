export const config = {
  name: 'web',
  tests: './src/test/**/*.e2e.ts',
  require: ['tsx/cjs'],
  output: './test-results',
  helpers: {
    Playwright: {
      url: 'http://localhost:5173',
      show: false,
      browser: 'chromium',
    },
  },
}
