import { Button } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'

import { useClipboardCode } from '../lib/use-clipboard-code'
import { useCountdown } from '../lib/use-countdown'
import { useOtpStatus } from '../model/use-otp-status'
import css from './otp-actions.module.scss'

type OtpActionsProps = {
  isDisabled: boolean
  isResendPending: boolean
  onPaste: (cells: string[]) => void
  onResend: () => void
}

export const OtpActions = ({
  isDisabled,
  isResendPending,
  onPaste,
  onResend,
}: OtpActionsProps) => {
  const navigate = useNavigate()
  const phone = useOnboardingStore(state => state.draft.phone)
  const status = useOtpStatus(phone || null)
  const { remaining } = useCountdown(status.data?.resendAvailableAt ?? null)
  const clipboardCode = useClipboardCode()

  return (
    <div className={css.actions}>
      <Button
        aria-label='Назад'
        icon='arrow-left'
        variant='icon'
        onClick={() => navigate({ to: '/onboarding/welcome' })}
      />
      {remaining > 0 ? (
        <Button
          className={css.fill}
          disabled={isDisabled || clipboardCode === null}
          icon='clipboard-paste'
          onClick={() => {
            if (clipboardCode !== null) onPaste(clipboardCode.split(''))
          }}
        >
          Вставить код из буфера
        </Button>
      ) : (
        <Button
          className={css.fill}
          isLoading={isResendPending}
          variant='secondary'
          onClick={onResend}
        >
          Отправить повторно
        </Button>
      )}
    </div>
  )
}
