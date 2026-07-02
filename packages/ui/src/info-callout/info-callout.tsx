import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'
import type { IconChipTone } from '../icon-chip/icon-chip'

import { pickCss } from '@raiymbek-park/shared'

import { IconChip } from '../icon-chip/icon-chip'
import css from './info-callout.module.scss'

type InfoCalloutVariant = 'info' | 'danger' | 'warning' | 'progress'

export type InfoCalloutProps = ComponentProps<'aside'> & {
  icon: IconGlyph
  variant?: InfoCalloutVariant
}

const calloutCss = pickCss(css, css.callout)

const toneByVariant: Record<InfoCalloutVariant, IconChipTone> = {
  danger: 'danger',
  info: 'brand',
  progress: 'info',
  warning: 'warning',
}

export const InfoCallout = ({
  children,
  className,
  icon,
  variant = 'info',
  ...restProps
}: InfoCalloutProps) => (
  <aside className={calloutCss({ variant }, className)} {...restProps}>
    <IconChip
      glyph={icon}
      iconSize={18}
      size={34}
      surface
      tone={toneByVariant[variant]}
    />
    <p className={css.message}>{children}</p>
  </aside>
)
