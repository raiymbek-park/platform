import type { ComponentProps } from 'react'

import { cssVariables, joinCss } from '@raiymbek-park/shared'

import css from './content.module.scss'

export type ContentProps = ComponentProps<'div'> & {
  gap?: number
}

export const Content = ({
  className,
  gap = 24,
  style,
  ...restProps
}: ContentProps) => (
  <div
    className={joinCss(css.content, className)}
    style={{ ...cssVariables({ gap: `${gap}px` }), ...style }}
    {...restProps}
  />
)
