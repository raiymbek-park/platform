import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { issueCategories } from '@raiymbek-park/shared/validation-schemas'

export type CategoryOption = {
  icon: IconGlyph
  label: string
  subtitle: string
  tone: IconChipTone
  value: IssueCategory
}

export type CategoryTheme = {
  glyph: IconGlyph
  tone: IconChipTone
}

const categoryStyles: Record<IssueCategory, CategoryTheme> = {
  complaint: { glyph: 'message-circle', tone: 'warning' },
  other: { glyph: 'coffee', tone: 'warning' },
  repair: { glyph: 'hammer', tone: 'info' },
  replacement: { glyph: 'refresh-cw', tone: 'accent' },
  violation: { glyph: 'triangle-alert', tone: 'danger' },
}

export const categoryTheme = (category: IssueCategory | null): CategoryTheme =>
  category ? categoryStyles[category] : categoryStyles.repair

export const useIssueCategories = (): CategoryOption[] => {
  const { t } = useLingui()
  const copy: Record<IssueCategory, { label: string; subtitle: string }> = {
    complaint: { label: t`Жалоба`, subtitle: t`Хочу пожаловаться` },
    other: { label: t`Прочее`, subtitle: t`Другая категория` },
    repair: { label: t`Ремонт`, subtitle: t`Требуется ремонт` },
    replacement: { label: t`Замена`, subtitle: t`Замена оборудования` },
    violation: { label: t`Нарушение`, subtitle: t`Нарушение правил` },
  }
  return issueCategories.map(value => ({
    icon: categoryStyles[value].glyph,
    label: copy[value].label,
    subtitle: copy[value].subtitle,
    tone: categoryStyles[value].tone,
    value,
  }))
}
