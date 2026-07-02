import type { ComponentProps, ReactNode } from 'react'

import { pickCss } from '@raiymbek-park/shared'

import css from './filter-tab.module.scss'

export type FilterTabProps = ComponentProps<'button'> & {
  isActive?: boolean
  label: ReactNode
}

const tabCss = pickCss(css, css.tab)

export const FilterTab = ({
  className,
  isActive,
  label,
  type = 'button',
  ...restProps
}: FilterTabProps) => (
  <button
    aria-pressed={isActive}
    className={tabCss({ isActive }, className)}
    type={type}
    {...restProps}
  >
    {label}
  </button>
)
