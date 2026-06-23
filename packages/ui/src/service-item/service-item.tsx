import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './service-item.module.scss'

export type ServiceItemProps = ComponentProps<'div'> & {
  description: ReactNode
  glyph: IconGlyph
  title: ReactNode
  tone?: IconChipTone
}

export const ServiceItem = ({
  className,
  description,
  glyph,
  title,
  tone,
  ...restProps
}: ServiceItemProps) => (
  <div className={joinCss(css.item, className)} {...restProps}>
    <IconChip glyph={glyph} iconSize={24} size={48} tone={tone} />
    <span className={css.text}>
      <span className={css.title}>{title}</span>
      <span className={css.description}>{description}</span>
    </span>
    <Icon className={css.chevron} glyph='chevron-right' size={20} />
  </div>
)
