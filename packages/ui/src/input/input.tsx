import { pickCss } from '@raiymbek-park/shared'
import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'
import { Icon } from '../icon'
import css from './input.module.scss'

export type InputProps = ComponentProps<'input'> & {
  icon?: IconGlyph
  state?: 'error' | 'success'
}

const inputCss = pickCss(css, css.input)

export const Input = ({ className, icon, state, ...restProps }: InputProps) => (
  <label className={inputCss({ state }, className)}>
    {icon && <Icon className={css.icon} glyph={icon} size={20} />}
    <input className={css.field} {...restProps} />
  </label>
)
