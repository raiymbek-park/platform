import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { issueStatuses } from '@raiymbek-park/shared/validation-schemas'

import { statusGlyphs, statusTones } from '@/shared/issue'

export type StatusOption = {
  glyph: IconGlyph
  label: string
  subtitle: string
  tone: IconChipTone
  value: IssueStatus
}

export const useStatusOptions = (): StatusOption[] => {
  const { t } = useLingui()
  const copy: Record<IssueStatus, { label: string; subtitle: string }> = {
    new: { label: t`Новый`, subtitle: t`Заявка только поступила` },
    'in-progress': {
      label: t`В работе`,
      subtitle: t`Управляющая компания решает заявку`,
    },
    planned: {
      label: t`Запланировано`,
      subtitle: t`Работы запланированы на будущее`,
    },
    blocked: { label: t`Заблокировано`, subtitle: t`Решение приостановлено` },
    'resident-review': {
      label: t`На рассмотрение жильцам`,
      subtitle: t`Нужно решение жильцов`,
    },
    done: { label: t`Выполнено`, subtitle: t`Заявка решена` },
    rejected: { label: t`Отклонено`, subtitle: t`Заявка отклонена` },
  }
  return issueStatuses.map(value => ({
    glyph: statusGlyphs[value],
    label: copy[value].label,
    subtitle: copy[value].subtitle,
    tone: statusTones[value],
    value,
  }))
}
