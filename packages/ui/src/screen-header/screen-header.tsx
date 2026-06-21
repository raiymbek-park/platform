import { joinCss } from '@raiymbek-park/shared'
import type { ComponentProps, ReactNode } from 'react'
import css from './screen-header.module.scss'

export type ScreenHeaderProps = ComponentProps<'header'> & {
  backAction?: ReactNode
  title?: ReactNode
}

export const ScreenHeader = ({
  backAction,
  className,
  title,
  ...restProps
}: ScreenHeaderProps) => (
  <header className={joinCss(css.screen, className)} {...restProps}>
    <span className={css.slot}>{backAction}</span>
    {title && <h1 className={css.title}>{title}</h1>}
    <span className={css.slot} />
  </header>
)
