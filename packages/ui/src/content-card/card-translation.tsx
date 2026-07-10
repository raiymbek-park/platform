import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './content-card.module.scss'

export type CardTranslationProps = ComponentProps<'div'> & {
  label: ReactNode
  toggleLabel: ReactNode
  onToggle: () => void
}

export const CardTranslation = ({
  className,
  label,
  toggleLabel,
  onToggle,
  ...restProps
}: CardTranslationProps) => (
  <div className={joinCss(css.translation, className)} {...restProps}>
    <Icon className={css.translationIcon} glyph='languages' size={16} />
    <span className={css.translationLabel}>{label}</span>
    <button className={css.translationToggle} type='button' onClick={onToggle}>
      {toggleLabel}
    </button>
  </div>
)
