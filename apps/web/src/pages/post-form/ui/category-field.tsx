import type {
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'

import { SelectField } from '@/shared/form'

import { usePostCategories } from '../model/use-post-categories'

export type CategoryFieldProps = {
  category: PostCategory | null
  error?: string
  kind: PostKind
  onSelect: (value: PostCategory) => void
}

export const CategoryField = ({
  category,
  error,
  kind,
  onSelect,
}: CategoryFieldProps) => {
  const { t } = useLingui()
  const categories = usePostCategories(kind)

  return (
    <SelectField
      error={error}
      label={t`Категория`}
      options={categories.map(option => ({
        glyph: option.icon,
        label: option.label,
        subtitle: option.subtitle,
        tone: option.tone,
        value: option.value,
      }))}
      isSelected={value => category === value}
      onSelect={onSelect}
    />
  )
}
