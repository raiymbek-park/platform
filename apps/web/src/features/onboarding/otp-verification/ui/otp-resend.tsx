import { useOnboardingStore } from '@/features/onboarding/registration-form'

import { useCountdown } from '../lib/use-countdown'
import { useOtpStatus } from '../model/use-otp-status'
import css from './otp-resend.module.scss'

export const OtpResend = () => {
  const phone = useOnboardingStore(state => state.draft.phone)
  const status = useOtpStatus(phone || null)
  const { mmss, remaining } = useCountdown(
    status.data?.resendAvailableAt ?? null,
  )

  if (remaining === 0) return null

  return (
    <div className={css.resend}>
      <span className={css.resendHint}>Не получили код?</span>
      <span className={css.timer}>Повторно через {mmss}</span>
    </div>
  )
}
