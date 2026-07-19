import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { CountPill } from '../count-pill/count-pill'
import css from './comment-count.module.scss'

export type CommentCountProps = ComponentProps<'button'> & {
  count: number
}

export const CommentCount = ({
  className,
  count,
  ...restProps
}: CommentCountProps) => (
  <CountPill
    className={joinCss(css.comment, className)}
    count={count}
    glyph='message-circle'
    {...restProps}
  />
)
