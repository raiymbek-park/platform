import type { ComponentProps, ReactNode } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import { Avatar } from '../avatar/avatar'
import { Carousel } from '../carousel/carousel'
import { LinkButton } from '../link-button/link-button'
import { Markdown } from '../markdown/markdown'
import css from './message-bubble.module.scss'

type MessageBubbleTranslateProps =
  | { translateLabel: ReactNode; onTranslate: () => void }
  | { translateLabel?: undefined; onTranslate?: undefined }

export type MessageBubbleProps = ComponentProps<'div'> &
  MessageBubbleTranslateProps & {
    actionsLabel?: string
    authorAvatar?: string
    authorName: string
    editedLabel?: ReactNode
    isEdited?: boolean
    isOwn?: boolean
    isTranslating?: boolean
    media?: string[]
    text?: string
    time: ReactNode
    onActions?: () => void
  }

const rowCss = pickCss(css, css.row)
const bubbleCss = pickCss(css, css.bubble)

type TranslateButtonProps = {
  isTranslating?: boolean
  label: ReactNode
  onTranslate: () => void
}

const TranslateButton = ({
  isTranslating,
  label,
  onTranslate,
}: TranslateButtonProps) => (
  <LinkButton
    className={css.translate}
    disabled={isTranslating}
    glyph={isTranslating ? 'loader-circle' : 'languages'}
    iconClassName={isTranslating ? css.loader : undefined}
    label={label}
    onClick={event => {
      event.stopPropagation()
      onTranslate()
    }}
  />
)

export const MessageBubble = ({
  actionsLabel,
  authorAvatar,
  authorName,
  className,
  editedLabel,
  isEdited,
  isOwn,
  isTranslating,
  media,
  text,
  time,
  translateLabel,
  onActions,
  onTranslate,
  ...restProps
}: MessageBubbleProps) => (
  <div className={joinCss(rowCss({ isOwn }), className)} {...restProps}>
    {!isOwn && <Avatar name={authorName} src={authorAvatar} />}
    {/* biome-ignore lint/a11y/useKeyWithClickEvents: tapping the bubble opens the actions sheet; keyboard a11y is not required (mobile-only) */}
    {/* biome-ignore lint/a11y/noStaticElementInteractions: the bubble is the tap target for message actions on touch devices */}
    <div
      className={bubbleCss({ isActionable: Boolean(onActions), isOwn })}
      title={onActions ? actionsLabel : undefined}
      onClick={
        onActions &&
        (event => {
          if (
            event.target instanceof Element &&
            event.target.closest('a, button')
          )
            return
          onActions?.()
        })
      }
    >
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
      {onTranslate && (
        <TranslateButton
          isTranslating={isTranslating}
          label={translateLabel}
          onTranslate={onTranslate}
        />
      )}
    </div>
  </div>
)
