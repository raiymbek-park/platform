import type { ClassificationTag } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'
import type { SelectFieldOption } from '@/shared/form'

import { useLingui } from '@lingui/react/macro'

import { SelectField } from '@/shared/form'

import { useTagOptions } from '../model/use-tag-options'

const tagVisuals: Record<
  ClassificationTag,
  { glyph: IconGlyph; tone: IconChipTone }
> = {
  warranty: { glyph: 'shield-check', tone: 'brand' },
  'needs-clarification': {
    glyph: 'message-circle-question-mark',
    tone: 'neutral',
  },
  duplicate: { glyph: 'copy', tone: 'neutral' },
}

export type TagSelectProps = {
  value: ClassificationTag[]
  onToggle: (value: ClassificationTag) => void
}

export const TagSelect = ({ value, onToggle }: TagSelectProps) => {
  const { t } = useLingui()
  const options: SelectFieldOption<ClassificationTag>[] = useTagOptions().map(
    tag => ({ ...tag, ...tagVisuals[tag.value] }),
  )

  return (
    <SelectField
      isCheckbox
      isSelected={tag => value.includes(tag)}
      label={t`Дополнительная информация`}
      options={options}
      onSelect={onToggle}
    />
  )
}
