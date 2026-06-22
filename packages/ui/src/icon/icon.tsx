import type { ComponentProps } from 'react'
import type { IconGlyph } from './types'

import { cssVariables, joinCss } from '@raiymbek-park/shared'

import css from './icon.module.scss'

export type IconProps = ComponentProps<'svg'> & {
  glyph: IconGlyph
  label?: string
  rotate?: number
  size?: string | number
  strokeWidth?: number
}

export const Icon = ({
  className,
  glyph,
  label,
  rotate = 0,
  size = 24,
  strokeWidth = 1.5,
  ...restProps
}: IconProps) => (
  <svg
    aria-hidden={label ? undefined : true}
    aria-label={label}
    className={joinCss(css.icon, className)}
    data-glyph={glyph}
    height={size}
    role={label ? 'img' : undefined}
    strokeWidth={strokeWidth}
    style={cssVariables({ rotation: `${rotate}deg` })}
    width={size}
    {...restProps}
  >
    {label && <title>{label}</title>}
    <use href={`/icon-sprites.svg#${glyph}`} />
  </svg>
)
