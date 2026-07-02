import type { ComponentProps, ReactNode } from 'react'
import type { StatusTagTone } from '../status-tag/status-tag'

import { joinCss } from '@raiymbek-park/shared'

import { StatusTag } from '../status-tag/status-tag'
import css from './issue-card.module.scss'

export type IssueCardBadge = {
  id: string
  label: ReactNode
  tone: StatusTagTone
}

export type IssueCardProps = ComponentProps<'article'> & {
  author: ReactNode
  badges: IssueCardBadge[]
  description: ReactNode
  number: ReactNode
  reactions?: ReactNode
  tags?: IssueCardBadge[]
  title: ReactNode
}

export const IssueCard = ({
  author,
  badges,
  className,
  description,
  number,
  reactions,
  tags,
  title,
  ...restProps
}: IssueCardProps) => (
  <article className={joinCss(css.card, className)} {...restProps}>
    <header className={css.head}>
      <div className={css.badges}>
        {badges.map(badge => (
          <StatusTag key={badge.id} label={badge.label} tone={badge.tone} />
        ))}
      </div>
      <span className={css.number}>{number}</span>
    </header>
    <h3 className={css.title}>{title}</h3>
    <p className={css.body}>{description}</p>
    {tags && tags.length > 0 && (
      <div className={css.tags}>
        {tags.map(tag => (
          <StatusTag key={tag.id} label={tag.label} tone={tag.tone} />
        ))}
      </div>
    )}
    <footer className={css.footer}>
      {reactions && <div className={css.reactions}>{reactions}</div>}
      <span className={css.author}>{author}</span>
    </footer>
  </article>
)
