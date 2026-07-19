import type { ComponentProps } from 'react'

import { pickCss } from '@raiymbek-park/shared'

import { CountPill } from '../count-pill/count-pill'
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
  ...restProps
}: ReactionProps) => (
  <CountPill
    aria-pressed={isActive}
    className={reactionCss({ isActive, kind }, className)}
    count={count}
    glyph={glyph[kind]}
    {...restProps}
  />
)
