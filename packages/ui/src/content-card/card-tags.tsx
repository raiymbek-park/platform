import type { ReactNode } from 'react'
import type { StatusTagTone } from '../status-tag/status-tag'

import { StatusTag } from '../status-tag/status-tag'
import css from './content-card.module.scss'

export type ContentCardBadge = {
  id: string
  label: ReactNode
  tone: StatusTagTone
}

export type CardTagsProps = {
  tags: ContentCardBadge[]
}

export const CardTags = ({ tags }: CardTagsProps) => (
  <div className={css.tags}>
    {tags.map(tag => (
      <StatusTag key={tag.id} label={tag.label} tone={tag.tone} />
    ))}
  </div>
)
