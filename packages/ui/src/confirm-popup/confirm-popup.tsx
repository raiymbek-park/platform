import type { ReactNode } from 'react'

import { Button } from '../button/button'
import { PopupMenu } from '../popup-menu/popup-menu'
import css from './confirm-popup.module.scss'

export type ConfirmPopupProps = {
  cancelLabel: ReactNode
  confirmLabel: ReactNode
  illustration?: string
  isLoading?: boolean
  isOpen: boolean
  message: ReactNode
  title: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export const ConfirmPopup = ({
  cancelLabel,
  confirmLabel,
  illustration,
  isLoading,
  isOpen,
  message,
  title,
  onCancel,
  onConfirm,
}: ConfirmPopupProps) => (
  <PopupMenu isOpen={isOpen} onClose={onCancel}>
    <div className={css.content}>
      {illustration && (
        <img alt='' className={css.illustration} src={illustration} />
      )}
      <div className={css.body}>
        <h2 className={css.title}>{title}</h2>
        <p className={css.message}>{message}</p>
      </div>
      <div className={css.buttons}>
        <Button isLoading={isLoading} variant='danger' onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button disabled={isLoading} variant='secondary' onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  </PopupMenu>
)
