import { Button } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import { useClipboardCode } from '../lib/use-clipboard-code'
import css from './otp-actions.module.scss'

type OtpActionsProps = {
  isDisabled: boolean
  isResendPending: boolean
  resendCooldown: number
  onPaste: (cells: string[]) => void
  onResend: () => void
}

const formatCooldown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const OtpActions = ({
  isDisabled,
  isResendPending,
  resendCooldown,
  onPaste,
  onResend,
}: OtpActionsProps) => {
  const navigate = useNavigate()
  const clipboardCode = useClipboardCode()

  return (
    <div className={css.actions}>
      <Button
        aria-label='Назад'
        icon='arrow-left'
        variant='icon'
        onClick={() => navigate({ to: '/onboarding/welcome' })}
      />
      {clipboardCode !== null ? (
        <Button
          className={css.fill}
          disabled={isDisabled}
          icon='clipboard-paste'
          onClick={() => onPaste(clipboardCode.split(''))}
        >
          Вставить код из буфера
        </Button>
      ) : (
        <Button
          className={css.fill}
          disabled={resendCooldown > 0}
          isLoading={isResendPending}
          variant='secondary'
          onClick={onResend}
        >
          {resendCooldown > 0
            ? `Запросить пин повторно через ${formatCooldown(resendCooldown)}`
            : 'Запросить пин повторно'}
        </Button>
      )}
    </div>
  )
}
