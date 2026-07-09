import type { ComponentProps, ReactNode } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import { Avatar } from '../avatar/avatar'
import { Carousel } from '../carousel/carousel'
import { Icon } from '../icon'
import { Markdown } from '../markdown/markdown'
import css from './message-bubble.module.scss'

export type MessageBubbleProps = ComponentProps<'div'> & {
  actionsLabel?: string
  authorName: string
  editedLabel?: ReactNode
  isEdited?: boolean
  isOwn?: boolean
  media?: string[]
  text?: string
  time: ReactNode
  onActions?: () => void
}

const rowCss = pickCss(css, css.row)
const bubbleCss = pickCss(css, css.bubble)
const actionsCss = pickCss(css, css.actions)

export const MessageBubble = ({
  actionsLabel,
  authorName,
  className,
  editedLabel,
  isEdited,
  isOwn,
  media,
  text,
  time,
  onActions,
  ...restProps
}: MessageBubbleProps) => (
  <div className={joinCss(rowCss({ isOwn }), className)} {...restProps}>
    {!isOwn && <Avatar name={authorName} />}
    <div className={bubbleCss({ isOwn })}>
      <header className={css.head}>
        <span className={css.name}>{authorName}</span>
        <time className={css.time}>{time}</time>
      </header>
      {media && media.length > 0 && (
        <div className={css.gallery}>
          <Carousel items={media.map(url => ({ id: url, url }))} />
        </div>
      )}
      {text && <Markdown className={css.text} content={text} />}
      {isEdited && editedLabel && (
        <span className={css.edited}>{editedLabel}</span>
      )}
    </div>
    {onActions && (
      <button
        aria-label={actionsLabel}
        className={actionsCss({ isOwn })}
        type='button'
        onClick={onActions}
      >
        <Icon glyph='ellipsis' size={18} />
      </button>
    )}
  </div>
)
