import { Button, HeroImage, InfoCallout, Input } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'

import { formatOtp, otpMask } from '../lib/format-otp'
import { isTooManyRequests } from '../lib/is-too-many-requests'
import { isWrongCode } from '../lib/is-wrong-code'
import { useOtpCode } from '../lib/use-otp-code'
import { useResendCooldown } from '../lib/use-resend-cooldown'
import { useConfirmCode } from '../model/use-confirm-code'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useRegisterResident } from '../model/use-register-resident'
import { useResendVerification } from '../model/use-resend-verification'
import { OtpActions } from './otp-actions'
import { OtpHeading } from './otp-heading'
import css from './otp-verification.module.scss'

const verifyError = 'Неверный код. Попробуйте ещё раз.'
const networkError = 'Не удалось проверить код. Проверьте соединение.'
const registerError = 'Не удалось завершить регистрацию. Повторите попытку.'

export const OtpVerification = () => {
  const navigate = useNavigate()
  const draft = useOnboardingStore(state => state.draft)
  const phone = draft.phone
  const recaptchaRef = useRef<HTMLDivElement>(null)

  const confirmCode = useConfirmCode()
  const resend = useResendVerification()
  const registerResident = useRegisterResident()
  const cooldown = useResendCooldown()

  const isChecking = confirmCode.isPending || registerResident.isPending

  const register = () => {
    const { block, role } = draft
    if (block === null || role === null) return
    registerResident.mutate(
      { ...draft, block, role },
      { onSuccess: () => navigate({ to: '/home' }) },
    )
  }

  const verify = (code: string, { clear }: { clear: () => void }) => {
    confirmCode.mutate(code, {
      onSuccess: register,
      onError: error => {
        clear()
        if (isTooManyRequests(error)) navigate({ to: '/onboarding/locked' })
      },
    })
  }

  const otp = useOtpCode({ disabled: isChecking, onComplete: verify })

  const handleResend = () => {
    const container = recaptchaRef.current
    if (phone === '' || container === null || cooldown.secondsLeft > 0) return
    otp.reset()
    confirmCode.reset()
    registerResident.reset()
    resend.mutate(
      { container, phone },
      {
        onSuccess: () => {
          otp.focus()
          cooldown.restart()
        },
        onError: error => {
          if (isTooManyRequests(error)) navigate({ to: '/onboarding/locked' })
        },
      },
    )
  }

  const resolveError = () => {
    if (confirmCode.isError) {
      return isWrongCode(confirmCode.error) ? verifyError : networkError
    }
    if (registerResident.isError) return registerError
    if (resend.isError) return networkError
    return null
  }
  const errorMessage = resolveError()

  return (
    <>
      <HeroImage src='images/otp-sms.png' />

      <div ref={recaptchaRef} />

      <OtpHeading />

      <Input
        ref={otp.inputRef}
        aria-label='Код подтверждения'
        autoFocus
        className={css.code}
        disabled={isChecking}
        inputMode='numeric'
        placeholder={otpMask}
        state={errorMessage !== null ? 'error' : undefined}
        value={formatOtp(otp.code)}
        onChange={event => otp.setValue(event.target.value)}
      />

      {errorMessage !== null && (
        <InfoCallout icon='circle-alert' variant='danger'>
          {errorMessage}
        </InfoCallout>
      )}

      {isChecking && (
        <InfoCallout icon='loader-circle' variant='progress'>
          Ваш код отправляется на проверку…
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
        isChecking={isChecking}
        isResendPending={resend.isPending}
        resendCooldown={cooldown.secondsLeft}
        onPaste={code => otp.setValue(code)}
        onResend={handleResend}
      />
    </>
  )
}
