import { joinCss } from '@raiymbek-park/shared'
import type { ComponentProps } from 'react'
import css from './divider.module.scss'

export type DividerProps = ComponentProps<'hr'>

export const Divider = ({ className, ...restProps }: DividerProps) => (
  <hr className={joinCss(css.divider, className)} {...restProps} />
)
