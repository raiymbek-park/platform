import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

export const statusGlyphs: Record<IssueStatus, IconGlyph> = {
  new: 'inbox',
  'in-progress': 'wrench',
  planned: 'calendar-clock',
  blocked: 'ban',
  'resident-review': 'users-round',
  done: 'circle-check-big',
  rejected: 'circle-x',
}

export const statusTones: Record<IssueStatus, IconChipTone> = {
  new: 'warning',
  'in-progress': 'action',
  planned: 'action',
  blocked: 'danger',
  'resident-review': 'accent',
  done: 'brand',
  rejected: 'danger',
}
