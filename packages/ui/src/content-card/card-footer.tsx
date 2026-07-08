import type { ReactNode } from 'react'

import { Icon } from '../icon'
import css from './content-card.module.scss'

export type CardFooterProps = {
  collapseLabel: ReactNode
  expandLabel: ReactNode
  isExpanded?: boolean
  reactions?: ReactNode
  onToggleExpand?: () => void
}

export const CardFooter = ({
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
