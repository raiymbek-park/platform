import type { ComponentProps, ReactNode } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import css from './textarea.module.scss'

export type TextareaProps = ComponentProps<'textarea'> & {
  label?: ReactNode
  state?: 'error' | 'success'
}

const boxCss = pickCss(css, css.box)

export const Textarea = ({
  className,
  label,
  ref,
  state,
  ...restProps
}: TextareaProps) => (
  <label className={joinCss(css.field, className)}>
    {label && <span className={css.label}>{label}</span>}
    <span className={boxCss({ state })}>
      <textarea className={css.control} ref={ref} {...restProps} />
    </span>
  </label>
)
