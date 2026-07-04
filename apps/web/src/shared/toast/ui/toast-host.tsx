import type { IconGlyph } from '@raiymbek-park/ui'
import type { Toast, ToastKind } from '../model/use-toast-store'

import { useLingui } from '@lingui/react/macro'
import { pickCss } from '@raiymbek-park/shared'
import { ToastMessage } from '@raiymbek-park/ui'
import { useEffect, useState } from 'react'

import { useToastStore } from '../model/use-toast-store'
import css from './toast-host.module.scss'

const iconByKind: Record<ToastKind, IconGlyph> = {
  error: 'triangle-alert',
  info: 'bell',
  success: 'circle-check',
}

const itemCss = pickCss(css, css.item)

type ToastItemProps = {
  closeLabel: string
  toast: Toast
  onDismiss: () => void
}

const ToastItem = ({ closeLabel, toast, onDismiss }: ToastItemProps) => {
  const [isLeaving, setIsLeaving] = useState(false)
  const leave = () => setIsLeaving(true)

  useEffect(() => {
    const id = setTimeout(() => setIsLeaving(true), toast.timeout)
    return () => clearTimeout(id)
  }, [toast.timeout])

  return (
    <ToastMessage
      className={itemCss({ isLeaving })}
      closeLabel={closeLabel}
      icon={iconByKind[toast.kind]}
      variant={toast.kind}
      onAnimationEnd={() => isLeaving && onDismiss()}
      onClose={leave}
    >
      {toast.text}
    </ToastMessage>
  )
}

export const ToastHost = () => {
  const { t } = useLingui()
  const toasts = useToastStore(state => state.toasts)
  const dismiss = useToastStore(state => state.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className={css.host}>
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          closeLabel={t`Закрыть`}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  )
}
