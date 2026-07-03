import type { ComponentProps } from 'react'

import { Icon } from '../icon'
import css from './comment-count.module.scss'

export type CommentCountProps = ComponentProps<'span'> & {
  count: number
}

export const CommentCount = ({ count, ...restProps }: CommentCountProps) => (
  <span className={css.comment} {...restProps}>
    <Icon glyph='message-circle' size={16} />
    <span className={css.count}>{count}</span>
  </span>
)
