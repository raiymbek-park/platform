import type { IconGlyph, SelectOptionTone } from '@raiymbek-park/ui'
import type { ReactNode } from 'react'

import { Divider, SelectOption } from '@raiymbek-park/ui'
import { Fragment } from 'react'

import css from './select-field.module.scss'

export type SelectFieldOption<T extends string> = {
  glyph: IconGlyph
  label: ReactNode
  subtitle?: ReactNode
  tone?: SelectOptionTone
  value: T
}

export type SelectFieldProps<T extends string> = {
  error?: string
  footer?: ReactNode
  isCheckbox?: boolean
  label: string
  options: SelectFieldOption<T>[]
  isSelected: (value: T) => boolean
  onSelect: (value: T) => void
}

export const SelectField = <T extends string>({
  error,
  footer,
  isCheckbox,
  label,
  options,
  isSelected,
  onSelect,
}: SelectFieldProps<T>) => (
  <div className={css.field}>
    <span className={css.label}>{label}</span>
    <div className={css.card}>
      <fieldset className={css.group}>
        <legend className='sr-only'>{label}</legend>
        {options.map((option, index) => (
          <Fragment key={option.value}>
            {index > 0 && <Divider />}
            <SelectOption
              icon={option.glyph}
              isCheckbox={isCheckbox}
              isSelected={isSelected(option.value)}
              label={option.label}
              subtitle={option.subtitle}
              tone={option.tone}
              onClick={() => onSelect(option.value)}
            />
          </Fragment>
        ))}
      </fieldset>
      {footer && (
        <>
          <Divider />
          {footer}
        </>
      )}
    </div>
    {error && <span className={css.error}>{error}</span>}
  </div>
)
