import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './input.module.scss'

export type InputProps = ComponentProps<'input'> & {
  icon?: IconGlyph
  label?: ReactNode
  state?: 'error' | 'success'
  tone?: IconChipTone
  trailing?: ReactNode
  onIconClick?: () => void
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
  tone,
  trailing,
  onIconClick,
  ...restProps
}: InputProps) => (
  <label className={joinCss(css.input, className)}>
    {label && <span className={css.label}>{label}</span>}
    <span className={boxCss({ state })}>
      {icon &&
        (onIconClick ? (
          <button
            className={css.iconButton}
            type='button'
            onClick={onIconClick}
          >
            <IconChip glyph={icon} iconSize={18} size={34} tone={tone} />
          </button>
        ) : (
          <IconChip glyph={icon} iconSize={18} size={34} tone={tone} />
        ))}
      <input className={css.field} ref={ref} {...restProps} />
      {trailing}
      {state && (
        <Icon className={css.status} glyph={statusGlyph[state]} size={18} />
      )}
    </span>
  </label>
)
