import { Button, InfoCallout } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'

import { useOnboardingStore } from '../model/use-onboarding-store'
import { useSendVerification } from '../model/use-send-verification'
import css from './account-locked.module.scss'

const retryError = 'Пока не получается отправить код. Попробуйте чуть позже.'

export const AccountLocked = () => {
  const navigate = useNavigate()
  const phone = useOnboardingStore(state => state.draft.phone)
  const sendVerification = useSendVerification()
  const recaptchaRef = useRef<HTMLSpanElement>(null)

  const retry = () => {
    const container = recaptchaRef.current
    if (phone === '' || container === null) return
    sendVerification.mutate(
      { container, phone },
      { onSuccess: () => navigate({ to: '/onboarding/verification' }) },
    )
  }

  return (
    <>
      <div className={css.illustration} />
      <span ref={recaptchaRef} />

      <header className={css.heading}>
        <h1 className={css.title}>Доступ заблокирован</h1>
        <p className={css.subtitle}>
          Слишком много попыток. Подождите немного и попробуйте снова.
        </p>
      </header>

      <div className={css.spacer} />

      {sendVerification.isError && (
        <InfoCallout icon='circle-alert' variant='danger'>
          {retryError}
        </InfoCallout>
      )}

      <Button
        icon='arrow-right'
        iconPosition='right'
        isLoading={sendVerification.isPending}
        onClick={retry}
      >
        Повторить
      </Button>
    </>
  )
}
