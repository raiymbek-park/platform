import { pickCss } from '@raiymbek-park/shared'
import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'
import { Icon } from '../icon'
import css from './info-callout.module.scss'

type InfoCalloutVariant = 'info' | 'danger' | 'warning'

export type InfoCalloutProps = ComponentProps<'aside'> & {
  icon?: IconGlyph
  variant?: InfoCalloutVariant
}

const calloutCss = pickCss(css, css.callout)

const defaultGlyph: Record<InfoCalloutVariant, IconGlyph> = {
  danger: 'droplet-off',
  info: 'message-circle',
  warning: 'zap',
}

export const InfoCallout = ({
  children,
  className,
  icon,
  variant = 'info',
  ...restProps
}: InfoCalloutProps) => (
  <aside className={calloutCss({ variant }, className)} {...restProps}>
    <Icon
      className={css.icon}
      glyph={icon ?? defaultGlyph[variant]}
      size={20}
    />
    <p className={css.message}>{children}</p>
  </aside>
)
