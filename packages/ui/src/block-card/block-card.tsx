import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './block-card.module.scss'

export type BlockTone = 'brand' | 'danger' | 'accent' | 'info'

export type BlockCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  description?: ReactNode
  icon?: IconGlyph
  isSelected?: boolean
  title: ReactNode
  tone?: BlockTone
}

const cardCss = pickCss(css, css.card)

export const BlockCard = ({
  className,
  description,
  disabled,
  icon,
  isSelected,
  title,
  tone = 'brand',
  type = 'button',
  ...restProps
}: BlockCardProps) => (
  <button
    aria-pressed={isSelected}
    className={cardCss({ isSelected, tone }, className)}
    disabled={disabled}
    type={type}
    {...restProps}
  >
    <span className={css.top}>
      {icon && (
        <IconChip glyph={icon} iconSize={22} size={40} surface tone={tone} />
      )}
      {isSelected && (
        <span className={css.check}>
          <Icon glyph='check' size={14} />
        </span>
      )}
    </span>
    <span className={css.info}>
      <span className={css.title}>{title}</span>
      {description && <span className={css.description}>{description}</span>}
    </span>
  </button>
)
