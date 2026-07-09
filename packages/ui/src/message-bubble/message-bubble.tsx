import type { ComponentProps, ReactNode } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import { Avatar } from '../avatar/avatar'
import { Carousel } from '../carousel/carousel'
import { Markdown } from '../markdown/markdown'
import css from './message-bubble.module.scss'

export type MessageBubbleProps = ComponentProps<'div'> & {
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

export const MessageBubble = ({
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
}: MessageBubbleProps) => {
  const body = (
    <>
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
    </>
  )

  return (
    <div className={joinCss(rowCss({ isOwn }), className)} {...restProps}>
      <Avatar name={authorName} />
      {onActions ? (
        <button
          className={bubbleCss({ isOwn })}
          type='button'
          onClick={onActions}
        >
          {body}
        </button>
      ) : (
        <div className={bubbleCss({ isOwn })}>{body}</div>
      )}
    </div>
  )
}
