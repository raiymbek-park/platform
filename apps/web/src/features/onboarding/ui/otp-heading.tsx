import { Trans } from '@lingui/react/macro'

import { formatPhoneDisplay } from '../lib/format-phone-display'
import { useOnboardingStore } from '../model/use-onboarding-store'
import css from './otp-heading.module.scss'

export const OtpHeading = () => {
  const phone = useOnboardingStore(state => state.draft.phone)

  return (
    <header className={css.heading}>
      <h1 className={css.title}>
        <Trans>Введите код из SMS</Trans>
      </h1>
      <p className={css.subtitle}>
        <Trans>Мы отправили 6-значный код подтверждения на ваш номер</Trans>
      </p>
      {phone !== '' && <p className={css.phone}>{formatPhoneDisplay(phone)}</p>}
    </header>
  )
}
