import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'
import { useEffect, useRef } from 'react'

import css from './popup-menu.module.scss'

export type PopupMenuProps = ComponentProps<'dialog'> & {
  isOpen: boolean
  onClose: () => void
}

export const PopupMenu = ({
  children,
  className,
  isOpen,
  onClose,
  ...restProps
}: PopupMenuProps) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> backdrop dismiss; ESC is handled via onCancel and keyboard a11y is not required (mobile-only)
    <dialog
      ref={ref}
      className={joinCss(css.sheet, className)}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      onClick={event => {
        if (event.target === ref.current) onClose()
      }}
      {...restProps}
    >
      <span className={css.handle} />
      <div className={css.content}>{children}</div>
    </dialog>
  )
}
