import { build } from 'esbuild'

await build({
  bundle: true,
  entryPoints: ['src/index.ts'],
  external: ['firebase-functions', 'firebase-admin', 'firebase-admin/*'],
  format: 'esm',
  outfile: 'lib/index.js',
  platform: 'node',
  target: 'node22',
})
