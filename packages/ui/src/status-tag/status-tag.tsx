import type { ComponentProps, ReactNode } from 'react'

import { pickCss } from '@raiymbek-park/shared'

import css from './status-tag.module.scss'

export type StatusTagTone =
  | 'info'
  | 'accent'
  | 'warning'
  | 'danger'
  | 'brand'
  | 'neutral'

export type StatusTagProps = ComponentProps<'span'> & {
  label: ReactNode
  tone?: StatusTagTone
}

const tagCss = pickCss(css, css.tag)

export const StatusTag = ({
  className,
  label,
  tone = 'neutral',
  ...restProps
}: StatusTagProps) => (
  <span className={tagCss({ tone }, className)} {...restProps}>
    {label}
  </span>
)
