import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './option-row.module.scss'

export type OptionTone = 'brand' | 'danger'

export type OptionRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconGlyph
  isSelected?: boolean
  label: ReactNode
  subtitle?: ReactNode
  tone?: OptionTone
}

const optionCss = pickCss(css, css.option)
const markCss = pickCss(css, css.mark)

export const OptionRow = ({
  className,
  icon,
  isSelected,
  label,
  subtitle,
  tone = 'brand',
  type = 'button',
  ...restProps
}: OptionRowProps) => (
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
    <span className={markCss({ isSelected })}>
      {isSelected && <Icon glyph='check' size={14} />}
    </span>
  </button>
)
