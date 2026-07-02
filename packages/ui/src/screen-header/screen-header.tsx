import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { IconChip } from '../icon-chip/icon-chip'
import css from './screen-header.module.scss'

export type ScreenHeaderProps = ComponentProps<'header'>

export const ScreenHeader = ({
  className,
  ...restProps
}: ScreenHeaderProps) => (
  <header className={joinCss(css.screen, className)} {...restProps}>
    <div className={css.logo}>
      <IconChip glyph='building-2' iconSize={24} size={40} />
      <span className={css.brand}>Raiymbek Park</span>
    </div>
  </header>
)
