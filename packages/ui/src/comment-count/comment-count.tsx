import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './comment-count.module.scss'

export type CommentCountProps = ComponentProps<'button'> & {
  count: number
}

export const CommentCount = ({
  className,
  count,
  type = 'button',
  ...restProps
}: CommentCountProps) => (
  <button
    className={joinCss(css.comment, className)}
    type={type}
    {...restProps}
  >
    <Icon glyph='message-circle' size={16} />
    <span className={css.count}>{count}</span>
  </button>
)
