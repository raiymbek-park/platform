import { Trans, useLingui } from '@lingui/react/macro'
import { Button, HeroImage } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import { showToastMessage } from '@/shared/toast'

import { logAuthError } from '../lib/auth-error'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useSendOtp } from '../model/use-send-otp'
import css from './account-locked.module.scss'

export const AccountLocked = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const phone = useOnboardingStore(state => state.draft.phone)
  const sendOtp = useSendOtp()

  const retry = () => {
    if (phone === '') return
    sendOtp.mutate(
      { phone },
      {
        onSuccess: () => navigate({ to: '/onboarding/verification' }),
        onError: error => {
          logAuthError('resend-locked', error)
          showToastMessage({
            kind: 'error',
            text: t`Пока не получается отправить код. Попробуйте чуть позже.`,
          })
        },
      },
    )
  }

  return (
    <>
      <HeroImage src='images/account-locked.png' />

      <header className={css.heading}>
        <h1 className={css.title}>
          <Trans>Доступ заблокирован</Trans>
        </h1>
        <p className={css.subtitle}>
          <Trans>
            Слишком много попыток. Подождите немного и попробуйте снова.
          </Trans>
        </p>
      </header>

      <div className={css.spacer} />

      <Button icon='refresh-cw' isLoading={sendOtp.isPending} onClick={retry}>
        <Trans>Повторить</Trans>
      </Button>
    </>
  )
}
