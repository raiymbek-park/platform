import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './link-button.module.scss'

export type LinkButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  glyph: IconGlyph
  iconClassName?: string
  label: ReactNode
}

export const LinkButton = ({
  className,
  glyph,
  iconClassName,
  label,
  type = 'button',
  ...restProps
}: LinkButtonProps) => (
  <button className={joinCss(css.button, className)} type={type} {...restProps}>
    <Icon className={iconClassName} glyph={glyph} size={16} />
    {label}
  </button>
)
