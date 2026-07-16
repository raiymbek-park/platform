import { authErrorCode } from './auth-error'

const dismissalCodes = [
  'auth/cancelled-popup-request',
  'auth/popup-closed-by-user',
  'auth/user-cancelled',
]

export const isPopupDismissed = (error: unknown) =>
  dismissalCodes.includes(authErrorCode(error) ?? '')

export const isPopupBlocked = (error: unknown) =>
  authErrorCode(error) === 'auth/popup-blocked'
