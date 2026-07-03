import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './input.module.scss'

export type InputProps = ComponentProps<'input'> & {
  icon?: IconGlyph
  label?: ReactNode
  state?: 'error' | 'success'
  trailing?: ReactNode
}

const boxCss = pickCss(css, css.box)

const statusGlyph: Record<NonNullable<InputProps['state']>, IconGlyph> = {
  error: 'circle-alert',
  success: 'check',
}

export const Input = ({
  className,
  icon,
  label,
  ref,
  state,
  trailing,
  ...restProps
}: InputProps) => (
  <label className={joinCss(css.input, className)}>
    {label && <span className={css.label}>{label}</span>}
    <span className={boxCss({ state })}>
      {icon && <IconChip glyph={icon} iconSize={18} size={34} />}
      <input className={css.field} ref={ref} {...restProps} />
      {state && (
        <Icon className={css.status} glyph={statusGlyph[state]} size={18} />
      )}
      {!state && trailing}
    </span>
  </label>
)
