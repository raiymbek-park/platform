import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'
import type { StatusTagTone } from '../status-tag/status-tag'

import { joinCss } from '@raiymbek-park/shared'

import { Divider } from '../divider/divider'
import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import { StatusTag } from '../status-tag/status-tag'
import css from './issue-card.module.scss'

export type IssueCardBadge = {
  id: string
  label: ReactNode
  tone: StatusTagTone
}

export type IssueCardContact = {
  glyph: IconGlyph
  isAction?: boolean
  isEmphasis?: boolean
  text: ReactNode
}

const contactClass = (contact: IssueCardContact) => {
  if (contact.isAction) return css.contactAction
  if (contact.isEmphasis) return css.contactName
  return css.contactText
}

export type IssueCardProps = ComponentProps<'article'> & {
  actions?: ReactNode
  badgeGlyph: IconGlyph
  badgeTone: IconChipTone
  collapseLabel: ReactNode
  contacts: IssueCardContact[]
  description: string
  expandLabel: ReactNode
  isExpanded?: boolean
  media?: string[]
  meta: ReactNode
  reactions?: ReactNode
  tags?: IssueCardBadge[]
  title: ReactNode
  onToggleExpand?: () => void
}

const CardTags = ({ tags }: { tags: IssueCardBadge[] }) => (
  <div className={css.tags}>
    {tags.map(tag => (
      <StatusTag key={tag.id} label={tag.label} tone={tag.tone} />
    ))}
  </div>
)

const CardContacts = ({ contacts }: { contacts: IssueCardContact[] }) => (
  <div className={css.contacts}>
    {contacts.map(contact => (
      <div key={contact.glyph} className={css.contact}>
        <Icon className={css.contactIcon} glyph={contact.glyph} size={16} />
        <span className={contactClass(contact)}>{contact.text}</span>
      </div>
    ))}
  </div>
)

type CardFooterProps = Pick<
  IssueCardProps,
  | 'collapseLabel'
  | 'expandLabel'
  | 'isExpanded'
  | 'reactions'
  | 'onToggleExpand'
>

const CardFooter = ({
  collapseLabel,
  expandLabel,
  isExpanded,
  reactions,
  onToggleExpand,
}: CardFooterProps) => (
  <footer className={css.footer}>
    {reactions && <div className={css.reactions}>{reactions}</div>}
    <button className={css.readMore} type='button' onClick={onToggleExpand}>
      {isExpanded ? collapseLabel : expandLabel}
      <Icon glyph={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
    </button>
  </footer>
)

const CardMedia = ({
  isExpanded,
  src,
}: {
  isExpanded?: boolean
  src: string
}) => (
  <img
    alt=''
    className={joinCss(css.photo, isExpanded && css.expanded)}
    loading='lazy'
    src={src}
  />
)

export const IssueCard = ({
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
  onToggleExpand,
  ...restProps
}: IssueCardProps) => (
  <article className={joinCss(css.card, className)} {...restProps}>
    {media?.[0] && <CardMedia isExpanded={isExpanded} src={media[0]} />}
    <div className={css.content}>
      <header className={css.head}>
        <IconChip glyph={badgeGlyph} iconSize={20} size={40} tone={badgeTone} />
        <div className={css.titleBlock}>
          <h3 className={css.title}>{title}</h3>
          <span className={css.meta}>{meta}</span>
        </div>
        {actions && <div className={css.actions}>{actions}</div>}
      </header>
      <p className={css.body}>{description}</p>
      {tags && tags.length > 0 && <CardTags tags={tags} />}
      <div className={joinCss(css.details, isExpanded && css.detailsOpen)}>
        <div className={css.detailsInner}>
          <Divider />
          <CardContacts contacts={contacts} />
        </div>
      </div>
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
