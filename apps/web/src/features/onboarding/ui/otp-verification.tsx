import { Trans, useLingui } from '@lingui/react/macro'
import { Button, HeroImage, InfoCallout, Input } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import { showToastMessage } from '@/shared/toast'

import { logAuthError, sendCodeErrorText } from '../lib/auth-error'
import { formatOtp, otpMask } from '../lib/format-otp'
import { isPopupBlocked, isPopupDismissed } from '../lib/google-auth-error'
import { isSignInFailure } from '../lib/is-sign-in-failure'
import { isTooManyRequests } from '../lib/is-too-many-requests'
import { isWrongCode } from '../lib/is-wrong-code'
import { useOtpCode } from '../lib/use-otp-code'
import { useResendCooldown } from '../lib/use-resend-cooldown'
import { useGoogleSignIn } from '../model/use-google-sign-in'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useRegisterResident } from '../model/use-register-resident'
import { useSendOtp } from '../model/use-send-otp'
import { useVerifyOtp } from '../model/use-verify-otp'
import { OtpActions } from './otp-actions'
import { OtpHeading } from './otp-heading'
import css from './otp-verification.module.scss'

export const OtpVerification = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const draft = useOnboardingStore(state => state.draft)
  const phone = draft.phone

  const verifyOtp = useVerifyOtp()
  const resend = useSendOtp()
  const registerResident = useRegisterResident()
  const googleSignIn = useGoogleSignIn()
  const cooldown = useResendCooldown()

  const isChecking = verifyOtp.isPending || registerResident.isPending

  const verifyError = t`Неверный код. Попробуйте ещё раз.`
  const networkError = t`Не удалось проверить код. Проверьте соединение.`
  const signInError = t`Не удалось выполнить вход. Повторите попытку.`
  const registerError = t`Не удалось завершить регистрацию. Повторите попытку.`
  const googleBlockedError = t`Не удалось открыть окно входа Google. Попробуйте ещё раз.`
  const googleNetworkError = t`Не удалось войти через Google. Проверьте соединение.`

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

  const handleVerifyError = (error: unknown, clear: () => void) => {
    if (isTooManyRequests(error)) {
      navigate({ to: '/onboarding/locked' })
      return
    }
    if (isWrongCode(error)) {
      clear()
      showToastMessage({ kind: 'error', text: verifyError })
      return
    }
    if (isSignInFailure(error)) {
      logAuthError('sign-in', error)
      showToastMessage({ kind: 'error', text: signInError })
      return
    }
    clear()
    logAuthError('verify-code', error)
    showToastMessage({ kind: 'error', text: networkError })
  }

  const verify = (code: string, { clear }: { clear: () => void }) => {
    verifyOtp.mutate(
      { code, phone },
      {
        onSuccess: register,
        onError: error => handleVerifyError(error, clear),
      },
    )
  }

  const otp = useOtpCode({ disabled: isChecking, onComplete: verify })

  const handleGoogleSignIn = () => {
    googleSignIn.mutate(undefined, {
      onSuccess: register,
      onError: error => {
        if (isPopupDismissed(error)) return
        logAuthError('google-sign-in', error)
        showToastMessage({
          kind: 'error',
          text: isPopupBlocked(error) ? googleBlockedError : googleNetworkError,
        })
      },
    })
  }

  const retrySignIn = () => {
    const input = verifyOtp.variables
    if (input === undefined) return
    verifyOtp.mutate(input, {
      onSuccess: register,
      onError: error => handleVerifyError(error, otp.reset),
    })
  }

  const handleResend = () => {
    if (phone === '' || cooldown.secondsLeft > 0) return
    otp.reset()
    verifyOtp.reset()
    registerResident.reset()
    resend.mutate(
      { phone },
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

  const isSignInRetry = verifyOtp.isError && isSignInFailure(verifyOtp.error)

  return (
    <>
      <HeroImage src='images/otp-sms.png' />

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

      {isSignInRetry && (
        <Button
          className={css.action}
          isLoading={verifyOtp.isPending}
          variant='secondary'
          onClick={retrySignIn}
        >
          <Trans>Повторить попытку</Trans>
        </Button>
      )}

      <div className={css.channels}>
        <Button
          disabled={isChecking}
          icon='google'
          isLoading={googleSignIn.isPending}
          variant='secondary'
          onClick={handleGoogleSignIn}
        >
          <Trans>Продолжить с Google</Trans>
        </Button>

        <OtpActions
          isChecking={isChecking}
          isResendPending={resend.isPending}
          resendCooldown={cooldown.secondsLeft}
          onResend={handleResend}
        />
      </div>
    </>
  )
}
