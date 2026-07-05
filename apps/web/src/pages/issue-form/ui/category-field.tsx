import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { Divider, SelectOption } from '@raiymbek-park/ui'
import { Fragment } from 'react'

import { useIssueCategories } from '../model/use-issue-categories'
import css from './category-field.module.scss'

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
    <div className={css.field}>
      <span className={css.label}>{t`Категория`}</span>
      <div className={css.card}>
        <fieldset className={css.group}>
          <legend className='sr-only'>{t`Категория`}</legend>
          {categories.map((option, index) => (
            <Fragment key={option.value}>
              {index > 0 && <Divider />}
              <SelectOption
                icon={option.icon}
                isSelected={category === option.value}
                label={option.label}
                subtitle={option.subtitle}
                tone={option.tone}
                onClick={() => onSelect(option.value)}
              />
            </Fragment>
          ))}
        </fieldset>
        <Divider />
        <SelectOption
          icon='zap'
          isCheckbox
          isSelected={urgent}
          label={t`Срочно`}
          subtitle={t`Требует срочного решения`}
          tone='danger'
          onClick={onToggleUrgent}
        />
      </div>
      {error && <span className={css.error}>{error}</span>}
    </div>
  )
}
