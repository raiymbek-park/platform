import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { SelectOption } from '@raiymbek-park/ui'

import { SelectField } from '@/shared/issue'

import { useIssueCategories } from '../model/use-issue-categories'

export type CategoryFieldProps = {
  category: IssueCategory | null
  error?: string
  urgent: boolean
  onSelect: (value: IssueCategory) => void
  onToggleUrgent: () => void
}

export const CategoryField = ({
  category,
  error,
  urgent,
  onSelect,
  onToggleUrgent,
}: CategoryFieldProps) => {
  const { t } = useLingui()
  const categories = useIssueCategories()

  return (
    <SelectField
      error={error}
      footer={
        <SelectOption
          icon='zap'
          isCheckbox
          isSelected={urgent}
          label={t`Срочно`}
          subtitle={t`Требует срочного решения`}
          tone='danger'
          onClick={onToggleUrgent}
        />
      }
      isSelected={value => category === value}
      label={t`Категория`}
      options={categories.map(option => ({
        glyph: option.icon,
        label: option.label,
        subtitle: option.subtitle,
        tone: option.tone,
        value: option.value,
      }))}
      onSelect={onSelect}
    />
  )
}
