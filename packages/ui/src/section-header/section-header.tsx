import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './section-header.module.scss'

export type SectionHeaderProps = ComponentProps<'header'> & {
  title: ReactNode
}

export const SectionHeader = ({
  children,
  className,
  title,
  ...restProps
}: SectionHeaderProps) => (
  <header className={joinCss(css.section, className)} {...restProps}>
    <h2 className={css.title}>{title}</h2>
    {children}
  </header>
)
