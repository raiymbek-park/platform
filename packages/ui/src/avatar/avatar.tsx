import type { ComponentProps } from 'react'

import { cssVariables, joinCss } from '@raiymbek-park/shared'

import css from './avatar.module.scss'

export type AvatarProps = ComponentProps<'span'> & {
  name: string
  size?: number
  src?: string
}

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0] ?? '')
    .join('')
    .toUpperCase()

export const Avatar = ({
  className,
  name,
  size = 40,
  src,
  style,
  ...restProps
}: AvatarProps) => (
  <span
    className={joinCss(css.avatar, className)}
    style={{ ...cssVariables({ size: `${size}px` }), ...style }}
    {...restProps}
  >
    {src ? (
      <img alt='' className={css.photo} src={src} />
    ) : (
      <span className={css.initials}>{initialsOf(name)}</span>
    )}
  </span>
)
