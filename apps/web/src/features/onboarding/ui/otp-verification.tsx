import { Trans, useLingui } from '@lingui/react/macro'
import { Button, HeroImage, InfoCallout, Input } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'

import { showToastMessage } from '@/shared/toast'

import { logAuthError, sendCodeErrorText } from '../lib/auth-error'
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

export const OtpVerification = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const draft = useOnboardingStore(state => state.draft)
  const phone = draft.phone
  const recaptchaRef = useRef<HTMLDivElement>(null)

  const confirmCode = useConfirmCode()
  const resend = useResendVerification()
  const registerResident = useRegisterResident()
  const cooldown = useResendCooldown()

  const isChecking = confirmCode.isPending || registerResident.isPending

  const verifyError = t`Неверный код. Попробуйте ещё раз.`
  const networkError = t`Не удалось проверить код. Проверьте соединение.`
  const registerError = t`Не удалось завершить регистрацию. Повторите попытку.`

  const register = () => {
    const { block, role } = draft
    if (block === null || role === null) return
    registerResident.mutate(
      { ...draft, block, role },
      {
        onSuccess: () => navigate({ to: '/home' }),
        onError: () => showToastMessage({ kind: 'error', text: registerError }),
      },
    )
  }

  const verify = (code: string, { clear }: { clear: () => void }) => {
    confirmCode.mutate(code, {
      onSuccess: register,
      onError: error => {
        clear()
        if (isTooManyRequests(error)) {
          navigate({ to: '/onboarding/locked' })
          return
        }
        if (isWrongCode(error)) {
          showToastMessage({ kind: 'error', text: verifyError })
          return
        }
        logAuthError('confirm-code', error)
        showToastMessage({ kind: 'error', text: networkError })
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
          if (isTooManyRequests(error)) {
            navigate({ to: '/onboarding/locked' })
            return
          }
          showToastMessage({ kind: 'error', text: sendCodeErrorText(error) })
        },
      },
    )
  }

  return (
    <>
      <HeroImage src='images/otp-sms.png' />

      <div ref={recaptchaRef} />

      <OtpHeading />

      <Input
        ref={otp.inputRef}
        aria-label={t`Код подтверждения`}
        autoFocus
        className={css.code}
        disabled={isChecking}
        inputMode='numeric'
        placeholder={otpMask}
        value={formatOtp(otp.code)}
        onChange={event => otp.setValue(event.target.value)}
      />

      {isChecking && (
        <InfoCallout icon='loader-circle' variant='progress'>
          <Trans>Ваш код отправляется на проверку…</Trans>
        </InfoCallout>
      )}

      {registerResident.isError && (
        <Button
          className={css.action}
          isLoading={registerResident.isPending}
          variant='secondary'
          onClick={register}
        >
          <Trans>Повторить попытку</Trans>
        </Button>
      )}

      <OtpActions
        isChecking={isChecking}
        isResendPending={resend.isPending}
        resendCooldown={cooldown.secondsLeft}
        onResend={handleResend}
      />
    </>
  )
}
