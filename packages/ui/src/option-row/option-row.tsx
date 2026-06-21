import { pickCss } from '@raiymbek-park/shared'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from '../icon'
import css from './option-row.module.scss'

export type OptionRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSelected?: boolean
  label: ReactNode
}

const optionCss = pickCss(css, css.option)

export const OptionRow = ({
  className,
  isSelected,
  label,
  type = 'button',
  ...restProps
}: OptionRowProps) => (
  <button
    aria-pressed={isSelected}
    className={optionCss({ isSelected }, className)}
    type={type}
    {...restProps}
  >
    <span className={css.label}>{label}</span>
    {isSelected && <Icon className={css.check} glyph='check' size={20} />}
  </button>
)
