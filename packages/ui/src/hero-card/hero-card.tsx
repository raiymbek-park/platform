import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './hero-card.module.scss'

export type HeroCardProps = ComponentProps<'section'> & {
  title: ReactNode
}

export const HeroCard = ({
  children,
  className,
  title,
  ...restProps
}: HeroCardProps) => (
  <section className={joinCss(css.card, className)} {...restProps}>
    <h2 className={css.title}>{title}</h2>
    {children}
  </section>
)
