import type { ComponentProps, ReactNode } from 'react'

import { cssVariables, joinCss } from '@raiymbek-park/shared'

import css from './empty-state.module.scss'

export type EmptyStateProps = ComponentProps<'div'> & {
  image: string
  message: ReactNode
  title: ReactNode
}

export const EmptyState = ({
  className,
  image,
  message,
  style,
  title,
  ...restProps
}: EmptyStateProps) => (
  <div className={joinCss(css.empty, className)} {...restProps}>
    <div
      className={css.illustration}
      style={{ ...cssVariables({ image: `url(${image})` }), ...style }}
    />
    <div className={css.heading}>
      <h2 className={css.title}>{title}</h2>
      <p className={css.message}>{message}</p>
    </div>
  </div>
)
