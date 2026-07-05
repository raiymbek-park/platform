import { randomId } from '@raiymbek-park/shared'
import { create } from 'zustand'

export type ToastKind = 'info' | 'error' | 'success'

export type Toast = {
  id: string
  kind: ToastKind
  text: string
  timeout: number
}

type ToastInput = {
  kind: ToastKind
  text: string
  timeout?: number
}

type ToastState = {
  toasts: readonly Toast[]
  show: (toast: ToastInput) => void
  dismiss: (id: string) => void
}

const DEFAULT_TIMEOUT = 4000

export const useToastStore = create<ToastState>()(set => ({
  toasts: [],
  show: ({ kind, text, timeout = DEFAULT_TIMEOUT }) =>
    set(state => ({
      toasts: [...state.toasts, { id: randomId(), kind, text, timeout }],
    })),
  dismiss: id =>
    set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
}))

export const showToastMessage = (toast: ToastInput) =>
  useToastStore.getState().show(toast)
