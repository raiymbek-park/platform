import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { SelectOptionTone } from '../select-option/select-option'

import { joinCss } from '@raiymbek-park/shared'
import { Fragment } from 'react'

import { Divider } from '../divider/divider'
import { SelectOption } from '../select-option/select-option'
import css from './select-card.module.scss'

export type SelectCardOption = {
  icon: IconGlyph
  isSelected: boolean
  key: string
  label: ReactNode
  subtitle?: ReactNode
  tone: SelectOptionTone
  onSelect: () => void
}

export type SelectCardProps = ComponentPropsWithoutRef<'fieldset'> & {
  legend: ReactNode
  options: SelectCardOption[]
}

export const SelectCard = ({
  className,
  legend,
  options,
  ...restProps
}: SelectCardProps) => (
  <fieldset className={joinCss(css.card, className)} {...restProps}>
    <legend className={css.legend}>{legend}</legend>
    {options.map((option, index) => (
      <Fragment key={option.key}>
        {index > 0 && <Divider />}
        <SelectOption
          icon={option.icon}
          isSelected={option.isSelected}
          label={option.label}
          subtitle={option.subtitle}
          tone={option.tone}
          onClick={option.onSelect}
        />
      </Fragment>
    ))}
  </fieldset>
)
