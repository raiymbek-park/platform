import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useOtpStatus } from '@/features/onboarding/otp-verification'
import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useCountdown } from '@/shared/lib'

import { formatHms } from '../lib/format-hms'
import css from './account-locked.module.scss'

export const AccountLocked = () => {
  const navigate = useNavigate()
  const phone = useOnboardingStore(state => state.draft.phone)
  const status = useOtpStatus(phone || null)
  const lockedUntil = status.data?.lockedUntil ?? null
  const remaining = useCountdown(lockedUntil)
  const [hours, minutes, seconds] = formatHms(remaining).split(':')

  useEffect(() => {
    if (!status.isLoading && remaining === 0) {
      navigate({ to: '/onboarding/verification' })
    }
  }, [navigate, remaining, status.isLoading])

  return (
    <section className={css.content}>
      <img alt='' className={css.hero} src='/images/account-locked.png' />

      <header className={css.heading}>
        <h1 className={css.title}>Доступ заблокирован</h1>
        <p className={css.subtitle}>
          Вы использовали все попытки ввода кода. Повторить можно через 24 часа.
        </p>
      </header>

      <p className={css.hint}>До разблокировки осталось</p>

      <output className={css.timer}>
        <span className={css.num}>{hours}</span>
        <span className={css.colon}>:</span>
        <span className={css.num}>{minutes}</span>
        <span className={css.colon}>:</span>
        <span className={css.num}>{seconds}</span>
      </output>
    </section>
  )
}
