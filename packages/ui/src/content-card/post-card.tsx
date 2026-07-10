import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'
import type { ContentCardContact } from './card-contacts'
import type { ContentCardBadge } from './card-tags'

import { joinCss } from '@raiymbek-park/shared'

import { Divider } from '../divider/divider'
import { CardBody } from './card-body'
import { CardContacts } from './card-contacts'
import { CardDetails } from './card-details'
import { CardFooter } from './card-footer'
import { CardHeader } from './card-header'
import { CardMedia } from './card-media'
import { CardTags } from './card-tags'
import css from './content-card.module.scss'

export type PostCardBadge = ContentCardBadge
export type PostCardContact = ContentCardContact

type PostCardMediaProps = {
  isExpanded?: boolean
  media?: string[]
}

const PostCardMedia = ({ isExpanded, media }: PostCardMediaProps) => {
  if (!media?.length) return null
  return <CardMedia isExpanded={isExpanded} media={media} />
}

const PostCardTags = ({ tags }: { tags?: PostCardBadge[] }) => {
  if (!tags?.length) return null
  return <CardTags tags={tags} />
}

type PostCardDetailsProps = {
  actions?: ReactNode
  contacts: PostCardContact[]
  isExpanded?: boolean
  translation?: ReactNode
}

const PostCardDetails = ({
  actions,
  contacts,
  isExpanded,
  translation,
}: PostCardDetailsProps) => {
  const hasInfo = contacts.length > 0 || Boolean(actions)
  if (!hasInfo && !translation) return null
  return (
    <CardDetails isExpanded={isExpanded}>
      {translation}
      {hasInfo && <Divider />}
      {contacts.length > 0 && <CardContacts contacts={contacts} />}
      {actions && <div className={css.actions}>{actions}</div>}
    </CardDetails>
  )
}

export type PostCardProps = ComponentProps<'article'> & {
  actions?: ReactNode
  badgeGlyph: IconGlyph
  badgeTone: IconChipTone
  collapseLabel: ReactNode
  contacts: PostCardContact[]
  description: string
  expandLabel: ReactNode
  isExpanded?: boolean
  media?: string[]
  meta: ReactNode
  reactions?: ReactNode
  tags?: PostCardBadge[]
  title: ReactNode
  translation?: ReactNode
  onToggleExpand?: () => void
}

export const PostCard = ({
  actions,
  badgeGlyph,
  badgeTone,
  className,
  collapseLabel,
  contacts,
  description,
  expandLabel,
  isExpanded,
  media,
  meta,
  reactions,
  tags,
  title,
  translation,
  onToggleExpand,
  ...restProps
}: PostCardProps) => (
  <article className={joinCss(css.card, className)} {...restProps}>
    <PostCardMedia isExpanded={isExpanded} media={media} />
    <div className={css.content}>
      <CardHeader
        glyph={media?.length ? undefined : badgeGlyph}
        meta={meta}
        title={title}
        tone={badgeTone}
      />
      <CardBody description={description} isExpanded={isExpanded} />
      <PostCardTags tags={tags} />
      <PostCardDetails
        actions={actions}
        contacts={contacts}
        isExpanded={isExpanded}
        translation={translation}
      />
      <CardFooter
        collapseLabel={collapseLabel}
        expandLabel={expandLabel}
        isExpanded={isExpanded}
        reactions={reactions}
        onToggleExpand={onToggleExpand}
      />
    </div>
  </article>
)
