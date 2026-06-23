import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './screen-footer.module.scss'

export type ScreenFooterProps = ComponentProps<'footer'>

export const ScreenFooter = ({
  className,
  ...restProps
}: ScreenFooterProps) => (
  <footer className={joinCss(css.footer, className)} {...restProps} />
)
