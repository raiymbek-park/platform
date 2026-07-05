import type { ClassificationTag } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { classificationTags } from '@raiymbek-park/shared/validation-schemas'

export type TagOption = {
  label: string
  subtitle: string
  value: ClassificationTag
}

export const useTagOptions = (): TagOption[] => {
  const { t } = useLingui()
  const copy: Record<ClassificationTag, { label: string; subtitle: string }> = {
    warranty: { label: t`По гарантии`, subtitle: t`Устранение по гарантии` },
    'needs-clarification': {
      label: t`Требуется уточнение`,
      subtitle: t`Нужны дополнительные детали`,
    },
    duplicate: { label: t`Дубликат`, subtitle: t`Повторяет другую заявку` },
  }
  return classificationTags.map(value => ({
    label: copy[value].label,
    subtitle: copy[value].subtitle,
    value,
  }))
}
