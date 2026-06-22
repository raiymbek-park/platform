import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useOtpStatus } from '@/features/onboarding/otp-verification'
import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useCountdown } from '@/shared/lib'

import { formatHms } from '../lib/format-hms'
import css from './account-locked.module.scss'

const units = ['hours', 'minutes', 'seconds'] as const

const toGroups = (hms: string) =>
  hms.split(':').map((value, index) => ({ unit: units[index] ?? '', value }))

const renderTimer = (hms: string) =>
  toGroups(hms).flatMap(({ unit, value }, index) => [
    ...(index > 0
      ? [
          <span className={css.colon} key={`colon-${unit}`}>
            :
          </span>,
        ]
      : []),
    <span className={css.num} key={unit}>
      {value}
    </span>,
  ])

export const AccountLocked = () => {
  const navigate = useNavigate()
  const phone = useOnboardingStore(state => state.draft.phone)
  const status = useOtpStatus(phone || null)
  const lockedUntil = status.data?.lockedUntil ?? null
  const remaining = useCountdown(lockedUntil)
  const hms = formatHms(remaining)

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

      <output className={css.timer}>{renderTimer(hms)}</output>
    </section>
  )
}
