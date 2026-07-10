import { createHash } from 'node:crypto'

export const hashSource = (...parts: string[]): string =>
  createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 32)
