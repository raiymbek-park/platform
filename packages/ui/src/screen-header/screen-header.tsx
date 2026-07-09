import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './screen-header.module.scss'

type BackControl =
  | { backLabel: string; onBack: () => void }
  | { backLabel?: never; onBack?: never }

export type ScreenHeaderProps = ComponentProps<'header'> &
  BackControl & {
    title?: ReactNode
  }

export const ScreenHeader = ({
  backLabel,
  className,
  title,
  onBack,
  ...restProps
}: ScreenHeaderProps) => (
  <header className={joinCss(css.screen, className)} {...restProps}>
    <div className={css.logo}>
      {onBack ? (
        <button
          aria-label={backLabel}
          className={css.back}
          type='button'
          onClick={onBack}
        >
          <Icon glyph='arrow-left' size={18} />
        </button>
      ) : (
        <IconChip glyph='building-2' iconSize={24} size={40} />
      )}
      <span className={css.brand}>{title ?? 'Raiymbek Park'}</span>
    </div>
  </header>
)
