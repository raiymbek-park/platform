const glyphs = [
  'megaphone',
  'clipboard-check',
  'droplet-off',
  'zap',
  'camera',
  'list-checks',
  'message-circle',
  'building-2',
  'shield',
  'droplets',
] as const

const tones = ['brand', 'danger', 'accent', 'info', 'warning'] as const

export type Glyph = (typeof glyphs)[number]

export type Tone = (typeof tones)[number]

export const toGlyph = (value: unknown): Glyph =>
  glyphs.find(g => g === value) ?? 'megaphone'

export const toTone = (value: unknown): Tone =>
  tones.find(t => t === value) ?? 'brand'

export const toText = (value: unknown): string =>
  typeof value === 'string' ? value : ''
