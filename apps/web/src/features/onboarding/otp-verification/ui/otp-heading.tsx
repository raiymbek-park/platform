import { useOnboardingStore } from '@/features/onboarding/registration-form'

import { formatPhoneDisplay } from '../lib/format-phone-display'
import css from './otp-heading.module.scss'

export const OtpHeading = () => {
  const phone = useOnboardingStore(state => state.draft.phone)

  return (
    <header className={css.heading}>
      <h1 className={css.title}>Введите код из SMS</h1>
      <p className={css.subtitle}>
        Мы отправили 6-значный код подтверждения на ваш номер
      </p>
      <p className={css.phone}>{formatPhoneDisplay(phone)}</p>
    </header>
  )
}
