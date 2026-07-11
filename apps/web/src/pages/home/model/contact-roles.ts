import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { t } from '@lingui/core/macro'

export type ContactRoleView = {
  glyph: IconGlyph
  label: string
  tone: IconChipTone
}

type RoleVisual = {
  glyph: IconGlyph
  tone: IconChipTone
}

const roleVisuals: Record<string, RoleVisual> = {
  electrician: { glyph: 'zap', tone: 'warning' },
  manager: { glyph: 'building-2', tone: 'brand' },
  plumber: { glyph: 'droplets', tone: 'info' },
  police: { glyph: 'siren', tone: 'accent' },
  security: { glyph: 'shield', tone: 'danger' },
}

const fallbackVisual: RoleVisual = { glyph: 'phone', tone: 'neutral' }

const roleLabels = (): Record<string, string> => ({
  electrician: t`Электрослужба`,
  manager: t`Управляющая компания`,
  plumber: t`Аварийная сантехника`,
  police: t`Полиция`,
  security: t`Охрана`,
})

export const resolveContactRole = (role: string): ContactRoleView => ({
  ...(roleVisuals[role] ?? fallbackVisual),
  label: roleLabels()[role] ?? role,
})
