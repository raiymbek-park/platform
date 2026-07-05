import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './spinner.module.scss'

export type SpinnerProps = ComponentProps<'div'> & {
  label?: string
  size?: number
}

export const Spinner = ({
  className,
  label,
  size = 32,
  ...restProps
}: SpinnerProps) => (
  <div
    aria-label={label}
    className={joinCss(css.spinner, className)}
    role='status'
    {...restProps}
  >
    <Icon className={css.icon} glyph='loader-circle' size={size} />
  </div>
)
