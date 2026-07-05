import type { ClassificationTag } from '@raiymbek-park/shared/validation-schemas'
import type { SelectFieldOption } from '@/shared/issue'

import { useLingui } from '@lingui/react/macro'

import { SelectField } from '@/shared/issue'

import { useTagOptions } from '../model/use-tag-options'

export type TagSelectProps = {
  value: ClassificationTag[]
  onToggle: (value: ClassificationTag) => void
}

export const TagSelect = ({ value, onToggle }: TagSelectProps) => {
  const { t } = useLingui()
  const options: SelectFieldOption<ClassificationTag>[] = useTagOptions().map(
    tag => ({ ...tag, glyph: 'clipboard-check', tone: 'info' }),
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
