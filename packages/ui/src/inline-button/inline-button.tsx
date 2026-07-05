import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './inline-button.module.scss'

export type InlineButtonTone = 'info' | 'danger' | 'success'

export type InlineButtonProps = ComponentProps<'button'> & {
  glyph: IconGlyph
  label: ReactNode
  tone: InlineButtonTone
}

const buttonCss = pickCss(css, css.button)

export const InlineButton = ({
  className,
  glyph,
  label,
  tone,
  type = 'button',
  ...restProps
}: InlineButtonProps) => (
  <button className={buttonCss({ tone }, className)} type={type} {...restProps}>
    <Icon glyph={glyph} size={16} />
    {label}
  </button>
)
