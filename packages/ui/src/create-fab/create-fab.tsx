import type { ComponentProps } from 'react'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './create-fab.module.scss'

export type CreateFabProps = ComponentProps<'span'> & {
  isHidden?: boolean
}

const fabCss = pickCss(css, css.fab)

export const CreateFab = ({
  className,
  isHidden,
  ...restProps
}: CreateFabProps) => (
  <span className={fabCss({ isHidden }, className)} {...restProps}>
    <Icon glyph='plus' size={26} />
  </span>
)
