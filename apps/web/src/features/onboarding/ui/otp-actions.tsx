import { useLingui } from '@lingui/react/macro'
import { Button } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import css from './otp-actions.module.scss'

type OtpActionsProps = {
  isChecking: boolean
  isResendPending: boolean
  resendCooldown: number
  onResend: () => void
}

const formatCooldown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const OtpActions = ({
  isChecking,
  isResendPending,
  resendCooldown,
  onResend,
}: OtpActionsProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()

  return (
    <div className={css.actions}>
      <Button
        aria-label={t`Назад`}
        disabled={isChecking}
        icon='arrow-left'
        variant='icon'
        onClick={() => navigate({ to: '/onboarding/welcome' })}
      />
      <Button
        className={css.fill}
        disabled={isChecking || isResendPending || resendCooldown > 0}
        isLoading={isResendPending}
        variant='secondary'
        onClick={onResend}
      >
        {resendCooldown > 0
          ? t`Запросить код повторно через ${formatCooldown(resendCooldown)}`
          : t`Запросить код повторно`}
      </Button>
    </div>
  )
}
