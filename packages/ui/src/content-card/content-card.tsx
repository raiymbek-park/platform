import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { CardMedia } from './card-media'
import css from './content-card.module.scss'

export type ContentCardProps = ComponentProps<'article'> & {
  children: ReactNode
  isExpanded?: boolean
  media?: string[]
}

export const ContentCard = ({
  children,
  className,
  isExpanded,
  media,
  ...restProps
}: ContentCardProps) => (
  <article className={joinCss(css.card, className)} {...restProps}>
    {media && media.length > 0 && (
      <CardMedia isExpanded={isExpanded} media={media} />
    )}
    <div className={css.content}>{children}</div>
  </article>
)
