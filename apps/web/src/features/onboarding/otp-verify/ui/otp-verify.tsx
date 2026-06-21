import { Button, InfoCallout, OtpInput, ScreenHeader } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useAuthStore } from '@/shared/auth'

import { formatPhoneDisplay } from '../lib/format-phone-display'
import { isVerifyRejection } from '../lib/is-verify-rejection'
import { useClipboardCode } from '../lib/use-clipboard-code'
import { useCountdown } from '../lib/use-countdown'
import { useOtpStatus } from '../model/use-otp-status'
import { useRegisterResident } from '../model/use-register-resident'
import { useResendOtp } from '../model/use-resend-otp'
import { useVerifyOtp } from '../model/use-verify-otp'
import css from './otp-verify.module.scss'

const emptyCells = ['', '', '', '']

const verifyError = 'Неверный код. Попробуйте снова.'
const networkError = 'Не удалось проверить код. Проверьте соединение.'
const registerError = 'Не удалось завершить регистрацию. Повторите попытку.'

export const OtpVerify = () => {
  const navigate = useNavigate()
  const pendingPhone = useOnboardingStore(state => state.pendingPhone)
  const draft = useOnboardingStore(state => state.draft)

  const verifyOtp = useVerifyOtp()
  const registerResident = useRegisterResident()
  const resendOtp = useResendOtp()
  const status = useOtpStatus(pendingPhone)

  const { mmss, remaining } = useCountdown(
    status.data?.resendAvailableAt ?? null,
  )
  const clipboardCode = useClipboardCode()

  const [cells, setCells] = useState(emptyCells)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [canRetryRegister, setCanRetryRegister] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const isChecking = verifyOtp.isPending || registerResident.isPending

  const focusCell = (index: number) => inputRefs.current[index]?.focus()

  // The phone is already verified once we reach here, so registration can be
  // retried directly without re-entering the (now spent) code.
  const register = async () => {
    if (draft.block === null || draft.role === null) {
      setErrorMessage(registerError)
      return
    }
    setErrorMessage(null)
    setCanRetryRegister(false)
    try {
      const pair = await registerResident.mutateAsync({
        apartment: Number(draft.apartment),
        block: String(draft.block),
        name: draft.name,
        phone: draft.phone,
        role: draft.role,
      })
      useAuthStore.getState().setTokens(pair)
      navigate({ to: '/home' })
    } catch {
      setErrorMessage(registerError)
      setCanRetryRegister(true)
    }
  }

  const verify = async (code: string) => {
    if (pendingPhone === null) return
    setErrorMessage(null)
    setCanRetryRegister(false)
    try {
      await verifyOtp.mutateAsync({ code, phone: pendingPhone })
      await register()
    } catch (error) {
      if (isVerifyRejection(error)) {
        setCells(emptyCells)
        setErrorMessage(verifyError)
        focusCell(0)
        return
      }
      setErrorMessage(networkError)
    }
  }

  const code = cells.join('')
  const verifyRef = useRef(verify)
  verifyRef.current = verify
  const submittedRef = useRef(false)

  useEffect(() => {
    if (code.length < 4) {
      submittedRef.current = false
      return
    }
    if (!isChecking && !submittedRef.current) {
      submittedRef.current = true
      verifyRef.current(code)
    }
  }, [code, isChecking])

  const handleDigit = (index: number, value: string) => {
    setCells(current => current.map((cell, i) => (i === index ? value : cell)))
    if (value !== '' && index < 3) focusCell(index + 1)
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && cells[index] === '' && index > 0) {
      focusCell(index - 1)
    }
  }

  const handlePaste = () => {
    if (clipboardCode === null) return
    setCells(clipboardCode.split(''))
  }

  const handleResend = async () => {
    if (pendingPhone === null) return
    setErrorMessage(null)
    setCanRetryRegister(false)
    setCells(emptyCells)
    try {
      await resendOtp.mutateAsync({ phone: pendingPhone })
      await status.refetch()
      focusCell(0)
    } catch {
      setErrorMessage(networkError)
    }
  }

  return (
    <section className={css.screen}>
      <ScreenHeader title='Подтверждение' />

      <header className={css.intro}>
        <p className={css.hint}>Код отправлен на номер</p>
        <p className={css.phone}>{formatPhoneDisplay(pendingPhone ?? '')}</p>
      </header>

      <fieldset className={css.cells} disabled={isChecking}>
        <legend className='sr-only'>Код подтверждения</legend>
        {cells.map((cell, index) => (
          <OtpInput
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length cell row
            key={index}
            ref={node => {
              inputRefs.current[index] = node
            }}
            autoFocus={index === 0}
            state={errorMessage !== null ? 'error' : undefined}
            value={cell}
            onChange={value => handleDigit(index, value)}
            onKeyDown={event => handleKeyDown(index, event.key)}
          />
        ))}
      </fieldset>

      {errorMessage !== null && (
        <InfoCallout variant='danger'>{errorMessage}</InfoCallout>
      )}

      {canRetryRegister && (
        <Button
          className={css.action}
          isLoading={registerResident.isPending}
          variant='secondary'
          onClick={register}
        >
          Повторить попытку
        </Button>
      )}

      <footer className={css.footer}>
        {remaining > 0 ? (
          <>
            <p className={css.timer}>Повторная отправка через {mmss}</p>
            <Button
              className={css.action}
              disabled={clipboardCode === null}
              icon='clipboard-check'
              variant='secondary'
              onClick={handlePaste}
            >
              Вставить код из буфера
            </Button>
          </>
        ) : (
          <Button
            className={css.action}
            isLoading={resendOtp.isPending}
            variant='secondary'
            onClick={handleResend}
          >
            Отправить повторно
          </Button>
        )}
      </footer>
    </section>
  )
}
