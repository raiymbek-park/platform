import type { ComponentProps, ReactNode } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './screen-title.module.scss'

export type ScreenTitleProps = ComponentProps<'header'> & {
  subtitle?: ReactNode
  title: ReactNode
}

export const ScreenTitle = ({
  className,
  subtitle,
  title,
  ...restProps
}: ScreenTitleProps) => (
  <header className={joinCss(css.intro, className)} {...restProps}>
    <h1 className={css.title}>{title}</h1>
    {subtitle && <p className={css.subtitle}>{subtitle}</p>}
  </header>
)
