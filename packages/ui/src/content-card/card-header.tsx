import type { ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { IconChip } from '../icon-chip/icon-chip'
import css from './content-card.module.scss'

export type CardHeaderProps = {
  glyph?: IconGlyph
  meta: ReactNode
  title: ReactNode
  tone?: IconChipTone
}

export const CardHeader = ({ glyph, meta, title, tone }: CardHeaderProps) => (
  <header className={css.head}>
    {glyph && tone && (
      <IconChip glyph={glyph} iconSize={20} size={40} tone={tone} />
    )}
    <div className={css.titleBlock}>
      <h3 className={css.title}>{title}</h3>
      <span className={css.meta}>{meta}</span>
    </div>
  </header>
)
