import { Button, InfoCallout, OtpInput, ScreenHeader } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useAuthStore } from '@/shared/auth'

import { formatPhoneDisplay } from '../lib/format-phone-display'
import { isServerError } from '../lib/is-server-error'
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const isChecking = verifyOtp.isPending || registerResident.isPending

  const focusCell = (index: number) => inputRefs.current[index]?.focus()

  const register = async () => {
    if (draft.block === null || draft.role === null) return
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
    }
  }

  const verify = async (code: string) => {
    if (pendingPhone === null) return
    setErrorMessage(null)
    try {
      await verifyOtp.mutateAsync({ code, phone: pendingPhone })
      await register()
    } catch (error) {
      if (isServerError(error)) {
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

  useEffect(() => {
    if (code.length === 4 && !isChecking) verifyRef.current(code)
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
