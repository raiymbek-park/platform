import type { ComponentProps, ReactNode } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { joinCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import { IconChip } from '../icon-chip/icon-chip'
import css from './contact-card.module.scss'

export type ContactCardProps = ComponentProps<'div'> & {
  glyph: IconGlyph
  name: ReactNode
  role: ReactNode
  tone?: IconChipTone
}

export const ContactCard = ({
  className,
  glyph,
  name,
  role,
  tone,
  ...restProps
}: ContactCardProps) => (
  <div className={joinCss(css.contact, className)} {...restProps}>
    <span className={css.left}>
      <IconChip glyph={glyph} iconSize={20} size={40} tone={tone} />
      <span className={css.text}>
        <span className={css.name}>{name}</span>
        <span className={css.role}>{role}</span>
      </span>
    </span>
    <span className={css.call}>
      <Icon glyph='phone' size={18} />
    </span>
  </div>
)
