import { joinCss } from '@raiymbek-park/shared'
import type { ComponentProps, ReactNode } from 'react'
import css from './section-header.module.scss'

export type SectionHeaderProps = ComponentProps<'header'> & {
  subtitle?: ReactNode
  title: ReactNode
}

export const SectionHeader = ({
  className,
  subtitle,
  title,
  ...restProps
}: SectionHeaderProps) => (
  <header className={joinCss(css.section, className)} {...restProps}>
    <h2 className={css.title}>{title}</h2>
    {subtitle && <p className={css.subtitle}>{subtitle}</p>}
  </header>
)
