import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'
import type { ContentCardContact } from './card-contacts'
import type { ContentCardBadge } from './card-tags'

import { Divider } from '../divider/divider'
import { CardBody } from './card-body'
import { CardContacts } from './card-contacts'
import { CardDetails } from './card-details'
import { CardFooter } from './card-footer'
import { CardHeader } from './card-header'
import { CardTags } from './card-tags'
import { ContentCard } from './content-card'
import css from './content-card.module.scss'

export type IssueCardBadge = ContentCardBadge
export type IssueCardContact = ContentCardContact

export type IssueCardProps = ComponentProps<'article'> & {
  actions?: ReactNode
  badgeGlyph: IconGlyph
  badgeTone: IconChipTone
  collapseLabel: ReactNode
  contacts: IssueCardContact[]
  description: string
  expandLabel: ReactNode
  follow?: ReactNode
  isExpanded?: boolean
  media?: string[]
  meta: ReactNode
  reactions?: ReactNode
  tags?: IssueCardBadge[]
  title: ReactNode
  translation?: ReactNode
  onToggleExpand?: () => void
}

export const IssueCard = ({
  actions,
  badgeGlyph,
  badgeTone,
  className,
  collapseLabel,
  contacts,
  description,
  expandLabel,
  follow,
  isExpanded,
  media,
  meta,
  reactions,
  tags,
  title,
  translation,
  onToggleExpand,
  ...restProps
}: IssueCardProps) => (
  <ContentCard
    className={className}
    isExpanded={isExpanded}
    media={media}
    {...restProps}
  >
    <CardHeader glyph={badgeGlyph} meta={meta} title={title} tone={badgeTone} />
    <CardBody description={description} isExpanded={isExpanded} />
    {tags && tags.length > 0 && <CardTags tags={tags} />}
    <CardDetails isExpanded={isExpanded}>
      {translation}
      {follow}
      <Divider />
      <CardContacts contacts={contacts} />
      {actions && <div className={css.actions}>{actions}</div>}
    </CardDetails>
    <CardFooter
      collapseLabel={collapseLabel}
      expandLabel={expandLabel}
      isExpanded={isExpanded}
      reactions={reactions}
      onToggleExpand={onToggleExpand}
    />
  </ContentCard>
)
