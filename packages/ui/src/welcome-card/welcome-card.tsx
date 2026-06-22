import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './welcome-card.module.scss'

export type WelcomeCardProps = ComponentProps<'section'> & {
  description?: ReactNode
  icon?: IconGlyph
  title: ReactNode
}

export const WelcomeCard = ({
  children,
  className,
  description,
  icon,
  title,
  ...restProps
}: WelcomeCardProps) => (
  <section className={joinCss(css.card, className)} {...restProps}>
    {icon && <Icon className={css.icon} glyph={icon} size={32} />}
    <h2 className={css.title}>{title}</h2>
    {description && <p className={css.description}>{description}</p>}
    {children}
  </section>
)
