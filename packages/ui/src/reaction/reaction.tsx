import type { ComponentProps } from 'react'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './reaction.module.scss'

export type ReactionKind = 'like' | 'dislike'

export type ReactionProps = ComponentProps<'button'> & {
  count: number
  isActive?: boolean
  kind: ReactionKind
}

const reactionCss = pickCss(css, css.reaction)

const glyph = { like: 'thumbs-up', dislike: 'thumbs-down' } as const

export const Reaction = ({
  className,
  count,
  isActive,
  kind,
  type = 'button',
  ...restProps
}: ReactionProps) => (
  <button
    aria-pressed={isActive}
    className={reactionCss({ isActive, kind }, className)}
    type={type}
    {...restProps}
  >
    <Icon glyph={glyph[kind]} size={16} />
    <span className={css.count}>{count}</span>
  </button>
)
