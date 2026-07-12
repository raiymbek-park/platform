import type { PostCategory } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

export type CategoryVisual = {
  glyph: IconGlyph
  tone: IconChipTone
}

export const announcementVisuals: Partial<
  Record<PostCategory, CategoryVisual>
> = {
  city: { glyph: 'landmark', tone: 'accent' },
  complex: { glyph: 'building-2', tone: 'brand' },
  management: { glyph: 'briefcase', tone: 'info' },
  other: { glyph: 'megaphone', tone: 'warning' },
}

export const offerVisuals: Partial<Record<PostCategory, CategoryVisual>> = {
  free: { glyph: 'gift', tone: 'warning' },
  other: { glyph: 'coffee', tone: 'warning' },
  rent: { glyph: 'key-round', tone: 'accent' },
  sell: { glyph: 'banknote', tone: 'info' },
  services: { glyph: 'handshake', tone: 'brand' },
  wanted: { glyph: 'search', tone: 'accent' },
}

export const fallbackVisual: CategoryVisual = {
  glyph: 'megaphone',
  tone: 'neutral',
}
