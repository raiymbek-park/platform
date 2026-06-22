import { Button, InfoCallout } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useAuthStore, useLockedPhoneStore } from '@/shared/auth'

import { isWrongCode } from '../lib/is-wrong-code'
import { useOtpCells } from '../lib/use-otp-cells'
import { useOtpStatus } from '../model/use-otp-status'
import { useRegisterResident } from '../model/use-register-resident'
import { useResendOtp } from '../model/use-resend-otp'
import { useVerifyOtp } from '../model/use-verify-otp'
import { OtpActions } from './otp-actions'
import { OtpCells } from './otp-cells'
import { OtpHeading } from './otp-heading'
import { OtpResend } from './otp-resend'
import css from './otp-verification.module.scss'

const verifyError = 'Неверный код. Запросите новый код.'
const networkError = 'Не удалось проверить код. Проверьте соединение.'
const registerError = 'Не удалось завершить регистрацию. Повторите попытку.'

export const OtpVerification = () => {
  const navigate = useNavigate()
  const draft = useOnboardingStore(state => state.draft)
  const phone = draft.phone

  const verifyOtp = useVerifyOtp()
  const resendOtp = useResendOtp()
  const registerResident = useRegisterResident()

  const isChecking = verifyOtp.isPending || registerResident.isPending

  const register = () => {
    const { block, role } = draft
    if (block === null || role === null) return
    registerResident.mutate(
      { ...draft, block, role },
      {
        onSuccess: pair => {
          useAuthStore.getState().setTokens(pair)
          navigate({ to: '/home' })
        },
      },
    )
  }

  const verify = (code: string, { clear }: { clear: () => void }) => {
    if (phone === '') return
    verifyOtp.mutate(
      { code, phone },
      {
        onSuccess: register,
        onError: error => {
          if (!isWrongCode(error)) clear()
        },
      },
    )
  }

  const status = useOtpStatus(phone || null)
  const isWrongCodeError = verifyOtp.isError && isWrongCode(verifyOtp.error)
  const isAttemptUsed = Boolean(status.data?.verifyUsed) || isWrongCodeError
  const isDisabled = isChecking || isAttemptUsed

  const otp = useOtpCells({ disabled: isDisabled, onComplete: verify })

  const handleResend = () => {
    if (phone === '') return
    otp.reset()
    verifyOtp.reset()
    registerResident.reset()
    resendOtp.mutate(
      { phone },
      {
        onSuccess: result => {
          if (result.lockedUntil !== null) {
            // Pin the locked number independently of the onboarding draft so
            // the lockout survives clearing local storage (S17).
            useLockedPhoneStore.getState().setLockedPhone(phone)
            navigate({ to: '/onboarding/locked' })
            return
          }
          otp.focusCell(0)
        },
      },
    )
  }

  const resolveError = () => {
    if (verifyOtp.isError) {
      return isWrongCode(verifyOtp.error) ? verifyError : networkError
    }
    if (registerResident.isError) return registerError
    if (resendOtp.isError) return networkError
    return null
  }
  const errorMessage = resolveError()

  return (
    <div className={css.content}>
      <img alt='' className={css.hero} src='/images/whatsapp.png' />

      <OtpHeading />

      {!status.isLoading && (
        <>
          <OtpCells
            cells={otp.cells}
            hasError={errorMessage !== null}
            inputRefs={otp.inputRefs}
            isDisabled={isDisabled}
            onDigit={otp.setDigit}
            onKeyDown={otp.handleKeyDown}
          />

          <OtpResend />

          {errorMessage !== null && (
            <InfoCallout icon='circle-alert' variant='danger'>
              {errorMessage}
            </InfoCallout>
          )}

          {registerResident.isError && (
            <Button
              className={css.action}
              isLoading={registerResident.isPending}
              variant='secondary'
              onClick={register}
            >
              Повторить попытку
            </Button>
          )}

          <OtpActions
            isDisabled={isDisabled}
            isResendPending={resendOtp.isPending}
            onPaste={cells => otp.setCells(cells)}
            onResend={handleResend}
          />
        </>
      )}
    </div>
  )
}
