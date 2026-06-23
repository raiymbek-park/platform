import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './location-badge.module.scss'

export type LocationBadgeProps = ComponentProps<'div'> & {
  text: ReactNode
}

export const LocationBadge = ({
  className,
  text,
  ...restProps
}: LocationBadgeProps) => (
  <div className={joinCss(css.badge, className)} {...restProps}>
    <Icon className={css.pin} glyph='map-pin' size={16} />
    <span className={css.text}>{text}</span>
  </div>
)
