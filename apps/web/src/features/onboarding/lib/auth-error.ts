import { t } from '@lingui/core/macro'

export const authErrorCode = (error: unknown): string | undefined =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'string'
    ? error.code
    : undefined

export const logAuthError = (context: string, error: unknown) => {
  console.error(
    `[phone-auth:${context}]`,
    authErrorCode(error) ?? 'unknown',
    error,
  )
}

const sendCodeMessages = (): Record<string, string> => ({
  'auth/quota-exceeded': t`Сервис отправки кодов временно перегружен. Попробуйте через несколько минут.`,
  'auth/invalid-phone-number': t`Проверьте правильность номера телефона.`,
  'auth/missing-phone-number': t`Введите номер телефона.`,
  'auth/network-request-failed': t`Нет связи с сервером. Проверьте интернет и попробуйте снова.`,
  'auth/captcha-check-failed': t`Не удалось пройти проверку безопасности. Обновите страницу и попробуйте снова.`,
  'auth/invalid-app-credential': t`Не удалось пройти проверку безопасности. Обновите страницу и попробуйте снова.`,
})

export const sendCodeErrorText = (error: unknown): string => {
  logAuthError('send-code', error)
  const code = authErrorCode(error)
  return (
    (code && sendCodeMessages()[code]) ??
    t`Не удалось отправить код. Попробуйте снова.`
  )
}
