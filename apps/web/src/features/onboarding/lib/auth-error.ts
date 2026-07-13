import { t } from '@lingui/core/macro'

import { trpcErrorCode } from './trpc-error'

export const authErrorCode = (error: unknown): string | undefined =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'string'
    ? error.code
    : undefined

const errorCode = (error: unknown): string | undefined =>
  trpcErrorCode(error) ?? authErrorCode(error)

export const logAuthError = (context: string, error: unknown) => {
  console.error(`[phone-auth:${context}]`, errorCode(error) ?? 'unknown', error)
}

const sendCodeMessages = (): Record<string, string> => ({
  BAD_GATEWAY: t`Не удалось отправить SMS. Попробуйте через несколько минут.`,
  BAD_REQUEST: t`Проверьте правильность номера телефона.`,
})

export const sendCodeErrorText = (error: unknown): string => {
  logAuthError('send-code', error)
  const code = errorCode(error)
  const message =
    (code && sendCodeMessages()[code]) ??
    t`Не удалось отправить код. Попробуйте снова.`
  return code ? `${message} (${code})` : message
}
