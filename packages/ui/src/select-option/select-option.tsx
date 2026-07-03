import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './select-option.module.scss'

export type SelectOptionTone = IconChipTone

export type SelectOptionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconGlyph
  isCheckbox?: boolean
  isSelected?: boolean
  label: ReactNode
  subtitle?: ReactNode
  tone?: SelectOptionTone
}

const optionCss = pickCss(css, css.option)
const markCss = pickCss(css, css.mark)

export const SelectOption = ({
  className,
  icon,
  isCheckbox,
  isSelected,
  label,
  subtitle,
  tone = 'brand',
  type = 'button',
  ...restProps
}: SelectOptionProps) => (
  <button
    aria-pressed={isSelected}
    className={optionCss({ isSelected }, className)}
    type={type}
    {...restProps}
  >
    {icon && <IconChip glyph={icon} size={42} tone={tone} />}
    <span className={css.text}>
      <span className={css.label}>{label}</span>
      {subtitle && <span className={css.subtitle}>{subtitle}</span>}
    </span>
    <span className={markCss({ isCheckbox, isSelected })}>
      {isSelected && <Icon glyph='check' size={14} />}
    </span>
  </button>
)
