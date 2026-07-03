import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'

export type CategoryOption = {
  icon: IconGlyph
  label: string
  subtitle: string
  tone: IconChipTone
  value: IssueCategory
}

export const useIssueCategories = (): CategoryOption[] => {
  const { t } = useLingui()

  return [
    {
      icon: 'hammer',
      label: t`Ремонт`,
      subtitle: t`Требуется ремонт`,
      tone: 'info',
      value: 'repair',
    },
    {
      icon: 'refresh-cw',
      label: t`Замена`,
      subtitle: t`Замена оборудования`,
      tone: 'accent',
      value: 'replacement',
    },
    {
      icon: 'message-circle',
      label: t`Жалоба`,
      subtitle: t`Хочу пожаловаться`,
      tone: 'warning',
      value: 'complaint',
    },
    {
      icon: 'triangle-alert',
      label: t`Нарушение`,
      subtitle: t`Нарушение правил`,
      tone: 'danger',
      value: 'violation',
    },
    {
      icon: 'ellipsis',
      label: t`Прочее`,
      subtitle: t`Другая категория`,
      tone: 'warning',
      value: 'other',
    },
  ]
}
