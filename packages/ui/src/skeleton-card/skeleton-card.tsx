import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './skeleton-card.module.scss'

export type SkeletonCardProps = ComponentProps<'div'>

export const SkeletonCard = ({
  className,
  ...restProps
}: SkeletonCardProps) => (
  <div className={joinCss(css.skeleton, className)} {...restProps}>
    <div className={css.head}>
      <span className={joinCss(css.block, css.badge)} />
      <span className={joinCss(css.block, css.badge)} />
    </div>
    <span className={joinCss(css.block, css.title)} />
    <span className={joinCss(css.block, css.line)} />
    <span className={joinCss(css.block, css.short)} />
    <div className={css.foot}>
      <span className={joinCss(css.block, css.pill)} />
      <span className={joinCss(css.block, css.pill)} />
    </div>
  </div>
)
