import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './spinner.module.scss'

export type SpinnerProps = ComponentProps<'div'> & {
  size?: number
}

export const Spinner = ({
  className,
  size = 32,
  ...restProps
}: SpinnerProps) => (
  <div className={joinCss(css.spinner, className)} {...restProps}>
    <Icon className={css.icon} glyph='loader-circle' size={size} />
  </div>
)
