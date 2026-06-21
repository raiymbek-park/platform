import { pickCss } from '@raiymbek-park/shared'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import { Icon } from '../icon'
import css from './block-card.module.scss'

export type BlockCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  description?: ReactNode
  icon?: IconGlyph
  isSelected?: boolean
  title: ReactNode
}

const cardCss = pickCss(css, css.card)

export const BlockCard = ({
  className,
  description,
  disabled,
  icon,
  isSelected,
  title,
  type = 'button',
  ...restProps
}: BlockCardProps) => (
  <button
    aria-pressed={isSelected}
    className={cardCss({ isSelected }, className)}
    disabled={disabled}
    type={type}
    {...restProps}
  >
    {icon && <Icon className={css.icon} glyph={icon} size={24} />}
    <span className={css.body}>
      <span className={css.title}>{title}</span>
      {description && <span className={css.description}>{description}</span>}
    </span>
  </button>
)
