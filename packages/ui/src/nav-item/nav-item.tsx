import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './nav-item.module.scss'

export type NavItemProps = ComponentProps<'span'> & {
  glyph: IconGlyph
  isActive?: boolean
  label?: string
}

const navCss = pickCss(css, css.nav)

export const NavItem = ({
  className,
  glyph,
  isActive,
  label,
  ...restProps
}: NavItemProps) => (
  <span className={navCss({ isActive }, className)} {...restProps}>
    <Icon glyph={glyph} label={label} size={22} />
  </span>
)
