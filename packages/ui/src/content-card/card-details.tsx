import type { ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './content-card.module.scss'

export type CardDetailsProps = {
  children: ReactNode
  isExpanded?: boolean
}

export const CardDetails = ({ children, isExpanded }: CardDetailsProps) => (
  <div className={joinCss(css.details, isExpanded && css.detailsOpen)}>
    <div className={css.detailsInner}>{children}</div>
  </div>
)
