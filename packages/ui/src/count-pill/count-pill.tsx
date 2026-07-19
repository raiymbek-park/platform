import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './count-pill.module.scss'

export type CountPillProps = ComponentProps<'button'> & {
  count: number
  glyph: IconGlyph
}

export const CountPill = ({
  className,
  count,
  glyph,
  type = 'button',
  ...restProps
}: CountPillProps) => (
  <button className={joinCss(css.pill, className)} type={type} {...restProps}>
    <Icon glyph={glyph} size={16} />
    <span className={css.count}>{count}</span>
  </button>
)
