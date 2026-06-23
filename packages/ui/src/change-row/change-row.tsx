import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { joinCss } from '@raiymbek-park/shared'

import { IconChip } from '../icon-chip/icon-chip'
import css from './change-row.module.scss'

export type ChangeRowProps = ComponentProps<'div'> & {
  glyph: IconGlyph
  text: ReactNode
  tone?: IconChipTone
}

export const ChangeRow = ({
  className,
  glyph,
  text,
  tone,
  ...restProps
}: ChangeRowProps) => (
  <div className={joinCss(css.row, className)} {...restProps}>
    <IconChip glyph={glyph} iconSize={16} size={30} tone={tone} />
    <span className={css.text}>{text}</span>
  </div>
)
