import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
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
  text: ReactNode
}

export type IssueCardProps = ComponentProps<'article'> & {
  badgeGlyph: IconGlyph
  collapseLabel: ReactNode
  contacts: IssueCardContact[]
  description: ReactNode
  expandLabel: ReactNode
  isExpanded?: boolean
  meta: ReactNode
  reactions?: ReactNode
  tags?: IssueCardBadge[]
  title: ReactNode
  onToggleExpand?: () => void
}

export const IssueCard = ({
  badgeGlyph,
  className,
  collapseLabel,
  contacts,
  description,
  expandLabel,
  isExpanded,
  meta,
  reactions,
  tags,
  title,
  onToggleExpand,
  ...restProps
}: IssueCardProps) => (
  <article className={joinCss(css.card, className)} {...restProps}>
    <header className={css.head}>
      <IconChip glyph={badgeGlyph} iconSize={20} size={40} tone='action' />
      <div className={css.titleBlock}>
        <h3 className={css.title}>{title}</h3>
        <span className={css.meta}>{meta}</span>
      </div>
    </header>
    <p className={css.body}>{description}</p>
    {tags && tags.length > 0 && (
      <div className={css.tags}>
        {tags.map(tag => (
          <StatusTag key={tag.id} label={tag.label} tone={tag.tone} />
        ))}
      </div>
    )}
    {isExpanded && (
      <div className={css.details}>
        <Divider />
        <div className={css.contacts}>
          {contacts.map(contact => (
            <div key={contact.glyph} className={css.contact}>
              <Icon
                className={css.contactIcon}
                glyph={contact.glyph}
                size={16}
              />
              <span
                className={
                  contact.isAction ? css.contactAction : css.contactText
                }
              >
                {contact.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
    <footer className={css.footer}>
      {reactions && <div className={css.reactions}>{reactions}</div>}
      <button className={css.readMore} type='button' onClick={onToggleExpand}>
        {isExpanded ? collapseLabel : expandLabel}
        <Icon glyph={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
    </footer>
  </article>
)
