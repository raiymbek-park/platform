import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'

import { cssVariables, pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './icon-chip.module.scss'

export type IconChipTone = 'brand' | 'danger' | 'accent' | 'info' | 'warning'

export type IconChipProps = ComponentProps<'span'> & {
  glyph: IconGlyph
  iconSize?: number
  size?: number
  surface?: boolean
  tone?: IconChipTone
}

const chipCss = pickCss(css, css.chip)

export const IconChip = ({
  className,
  glyph,
  iconSize = 20,
  size = 40,
  style,
  surface = false,
  tone = 'brand',
  ...restProps
}: IconChipProps) => (
  <span
    className={chipCss({ surface, tone }, className)}
    style={{ ...cssVariables({ chipSize: `${size}px` }), ...style }}
    {...restProps}
  >
    <Icon glyph={glyph} size={iconSize} />
  </span>
)
