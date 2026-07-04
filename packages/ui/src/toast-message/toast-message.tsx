import type { ComponentProps } from 'react'
import type { IconGlyph } from '../icon'

import { pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './toast-message.module.scss'

type ToastVariant = 'info' | 'error' | 'success'

export type ToastMessageProps = ComponentProps<'aside'> & {
  closeLabel: string
  icon: IconGlyph
  variant?: ToastVariant
  onClose?: () => void
}

const toastCss = pickCss(css, css.toast)

export const ToastMessage = ({
  children,
  className,
  closeLabel,
  icon,
  variant = 'info',
  onClose,
  ...restProps
}: ToastMessageProps) => (
  <aside className={toastCss({ variant }, className)} {...restProps}>
    <Icon className={css.icon} glyph={icon} size={20} />
    <p className={css.message}>{children}</p>
    <button
      aria-label={closeLabel}
      className={css.close}
      type='button'
      onClick={onClose}
    >
      <Icon glyph='x' size={16} />
    </button>
  </aside>
)
